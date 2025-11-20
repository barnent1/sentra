#!/usr/bin/env python3
"""
Figma → Sentra Import Script

Imports Figma designs and merges them with architect's behavioral specs
to create complete screen specifications for agent consumption.

Features:
- Fetches designs from Figma REST API
- Parses screens (frames) and components
- Extracts design tokens (colors, spacing, typography)
- Loads behavioral specs from architect sessions
- Generates complete screen specs in YAML format

Usage:
    python .sentra/scripts/figma-import.py \\
      --figma-url https://figma.com/file/abc123 \\
      --project bookmark-manager

Requirements:
    - FIGMA_ACCESS_TOKEN environment variable
    - Architect session with ui-screens.md
"""

import sys
import os
import json
import argparse
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from urllib.parse import urlparse
import logging

try:
    import requests
    import yaml
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Error: Missing required dependency: {e}")
    print("\nPlease install dependencies:")
    print("  pip install requests pyyaml python-dotenv")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class DesignToken:
    """Represents a design token (color, spacing, etc.)"""
    name: str
    value: str
    category: str  # color, spacing, typography, etc.
    description: Optional[str] = None


@dataclass
class FigmaComponent:
    """Represents a Figma component"""
    id: str
    name: str
    type: str
    children: List['FigmaComponent']
    properties: Dict[str, Any]


@dataclass
class ScreenBehavior:
    """Behavioral specification from architect"""
    on_load: List[str]
    user_actions: List[Dict[str, str]]
    states: List[str]
    validation_rules: List[str]
    error_handling: List[str]


@dataclass
class E2ETest:
    """E2E test scenario"""
    name: str
    description: str
    steps: List[str]
    assertions: List[str]


@dataclass
class ScreenSpec:
    """Complete screen specification"""
    screen: str
    route: str
    figma_url: str
    v0_source: Optional[str]

    # FROM FIGMA: Visual structure
    layout: Dict[str, Any]
    components: List[str]

    # FROM ARCHITECT: Behavior
    behavior: ScreenBehavior

    # FROM ARCHITECT: E2E tests
    e2e_tests: List[E2ETest]

    # FROM FIGMA: Design tokens
    design_tokens: Dict[str, Dict[str, str]]

    # Metadata
    created_at: str
    figma_file_id: str
    figma_node_id: str


class FigmaAPIError(Exception):
    """Figma API error"""
    pass


class ArchitectSpecNotFoundError(Exception):
    """Architect session spec not found"""
    pass


class FigmaImporter:
    """Imports Figma designs and merges with behavioral specs"""

    FIGMA_API_BASE = "https://api.figma.com/v1"

    def __init__(self, access_token: str, project_dir: Path):
        """
        Initialize Figma importer

        Args:
            access_token: Figma personal access token
            project_dir: Root project directory
        """
        self.access_token = access_token
        self.project_dir = project_dir
        self.session = requests.Session()
        self.session.headers.update({
            'X-Figma-Token': access_token,
            'Content-Type': 'application/json'
        })

    def import_design(
        self,
        figma_url: str,
        project_name: str,
        output_dir: Optional[Path] = None
    ) -> List[Path]:
        """
        Main import flow

        Args:
            figma_url: Figma file URL
            project_name: Project name (for architect session lookup)
            output_dir: Output directory for specs (default: docs/specs/screens/)

        Returns:
            List of generated spec file paths
        """
        logger.info("🎨 Figma → Sentra Import")
        logger.info(f"Figma URL: {figma_url}")
        logger.info(f"Project: {project_name}")
        logger.info("")

        # Validate architect session exists FIRST (before calling Figma API)
        logger.info("Step 1: Validating architect session...")
        architect_specs = self.load_architect_specs(project_name)
        logger.info(f"✓ Loaded specs for {len(architect_specs)} screens")

        # Parse Figma URL
        file_id, node_ids = self.parse_figma_url(figma_url)
        logger.info(f"✓ Parsed Figma file ID: {file_id}")

        # Fetch Figma file
        logger.info("Step 2: Fetching Figma file...")
        figma_data = self.fetch_figma_file(file_id, node_ids)
        logger.info(f"✓ Fetched file: {figma_data.get('name', 'Unknown')}")

        # Parse screens (frames)
        logger.info("Step 3: Parsing screens...")
        screens = self.parse_screens(figma_data)
        logger.info(f"✓ Found {len(screens)} screens")

        # Extract design tokens
        logger.info("Step 4: Extracting design tokens...")
        design_tokens = self.extract_design_tokens(figma_data)
        logger.info(f"✓ Extracted {sum(len(v) for v in design_tokens.values())} tokens")

        # Merge and generate screen specs
        logger.info("Step 5: Generating screen specs...")
        output_dir = output_dir or self.project_dir / "docs" / "specs" / "screens"
        output_dir.mkdir(parents=True, exist_ok=True)

        generated_files = []
        for screen in screens:
            screen_name = screen['name']

            # Get behavioral spec
            behavior_spec = architect_specs.get(screen_name)
            if not behavior_spec:
                logger.warning(f"⚠️  No behavioral spec found for '{screen_name}' - skipping")
                continue

            # Create complete spec
            spec = self.create_screen_spec(
                screen=screen,
                behavior=behavior_spec,
                design_tokens=design_tokens,
                figma_url=figma_url,
                file_id=file_id
            )

            # Write to file
            output_file = output_dir / f"{self.sanitize_filename(screen_name)}.yml"
            self.write_spec(spec, output_file)
            generated_files.append(output_file)

            logger.info(f"✓ Generated: {output_file.name}")

        logger.info("")
        logger.info(f"✅ Import complete! Generated {len(generated_files)} screen specs")
        logger.info(f"📁 Output directory: {output_dir}")

        return generated_files

    def parse_figma_url(self, url: str) -> Tuple[str, Optional[List[str]]]:
        """
        Parse Figma URL to extract file ID and optional node IDs

        Supported formats:
        - https://www.figma.com/file/{file_id}/{title}
        - https://www.figma.com/file/{file_id}/{title}?node-id={node_id}

        Args:
            url: Figma URL

        Returns:
            Tuple of (file_id, node_ids)

        Raises:
            ValueError: If URL format is invalid
        """
        # Handle figma:// protocol
        if url.startswith('figma://'):
            url = url.replace('figma://', 'https://www.figma.com/')

        parsed = urlparse(url)

        # Extract file ID from path
        path_parts = parsed.path.strip('/').split('/')
        if len(path_parts) < 2 or path_parts[0] != 'file':
            raise ValueError(
                f"Invalid Figma URL format: {url}\n"
                "Expected: https://www.figma.com/file/{{file_id}}/{{title}}"
            )

        file_id = path_parts[1]

        # Extract node IDs from query params (if present)
        node_ids = None
        if parsed.query:
            from urllib.parse import parse_qs
            query_params = parse_qs(parsed.query)
            if 'node-id' in query_params:
                node_ids = query_params['node-id']

        return file_id, node_ids

    def fetch_figma_file(
        self,
        file_id: str,
        node_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Fetch Figma file data via REST API

        Args:
            file_id: Figma file ID
            node_ids: Optional list of specific node IDs to fetch

        Returns:
            Figma file data

        Raises:
            FigmaAPIError: If API request fails
        """
        try:
            if node_ids:
                # Fetch specific nodes
                url = f"{self.FIGMA_API_BASE}/files/{file_id}/nodes"
                params = {'ids': ','.join(node_ids)}
            else:
                # Fetch entire file
                url = f"{self.FIGMA_API_BASE}/files/{file_id}"
                params = {}

            response = self.session.get(url, params=params)
            response.raise_for_status()

            return response.json()

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                raise FigmaAPIError(
                    "Authentication failed. Please check your FIGMA_ACCESS_TOKEN.\n"
                    "Get your token at: https://www.figma.com/settings"
                )
            elif e.response.status_code == 404:
                raise FigmaAPIError(
                    f"File not found: {file_id}\n"
                    "Make sure the file exists and you have access to it."
                )
            else:
                raise FigmaAPIError(f"Figma API error: {e}")
        except requests.exceptions.RequestException as e:
            raise FigmaAPIError(f"Network error: {e}")

    def parse_screens(self, figma_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parse screens (top-level frames) from Figma file

        Args:
            figma_data: Figma file data

        Returns:
            List of screen definitions
        """
        screens = []

        # Handle both full file and nodes response
        if 'document' in figma_data:
            root = figma_data['document']
        elif 'nodes' in figma_data:
            root = {'children': list(figma_data['nodes'].values())}
        else:
            return screens

        # Find all canvas/page nodes
        for page in root.get('children', []):
            if page.get('type') == 'CANVAS':
                # Frames on canvas are screens
                for frame in page.get('children', []):
                    if frame.get('type') == 'FRAME':
                        screen = self.parse_screen_node(frame)
                        screens.append(screen)

        return screens

    def parse_screen_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse a single screen node

        Args:
            node: Figma frame node

        Returns:
            Screen definition
        """
        return {
            'id': node.get('id'),
            'name': node.get('name', 'Untitled'),
            'type': node.get('type'),
            'width': node.get('absoluteBoundingBox', {}).get('width', 0),
            'height': node.get('absoluteBoundingBox', {}).get('height', 0),
            'layout': self.parse_layout(node),
            'components': self.extract_component_names(node),
            'styles': self.extract_node_styles(node)
        }

    def parse_layout(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse layout properties from node

        Args:
            node: Figma node

        Returns:
            Layout specification
        """
        layout = {
            'type': self.detect_layout_type(node),
        }

        # Auto layout properties
        if node.get('layoutMode'):
            layout['direction'] = node.get('layoutMode', '').lower()
            layout['spacing'] = node.get('itemSpacing', 0)
            layout['padding'] = {
                'top': node.get('paddingTop', 0),
                'right': node.get('paddingRight', 0),
                'bottom': node.get('paddingBottom', 0),
                'left': node.get('paddingLeft', 0)
            }
            layout['alignment'] = {
                'primary': node.get('primaryAxisAlignItems', 'MIN'),
                'counter': node.get('counterAxisAlignItems', 'MIN')
            }

        # Parse children
        if 'children' in node:
            layout['children'] = [
                self.parse_child_component(child)
                for child in node.get('children', [])
            ]

        return layout

    def detect_layout_type(self, node: Dict[str, Any]) -> str:
        """
        Detect CSS layout type from Figma node

        Args:
            node: Figma node

        Returns:
            Layout type (flex, grid, absolute, etc.)
        """
        if node.get('layoutMode'):
            return 'flex'
        elif node.get('layoutGrids'):
            return 'grid'
        else:
            return 'absolute'

    def parse_child_component(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse child component

        Args:
            node: Child node

        Returns:
            Component definition
        """
        return {
            'name': node.get('name', 'Untitled'),
            'type': node.get('type', 'UNKNOWN'),
            'component': self.detect_component_type(node),
            'properties': self.extract_component_properties(node)
        }

    def detect_component_type(self, node: Dict[str, Any]) -> str:
        """
        Detect semantic component type from Figma node

        Args:
            node: Figma node

        Returns:
            Component type (Button, Input, Card, etc.)
        """
        name = node.get('name', '').lower()
        node_type = node.get('type', '')

        # Component instances
        if node_type == 'INSTANCE':
            component_name = node.get('componentId', '')
            return component_name or 'Component'

        # Detect from name
        if 'button' in name:
            return 'Button'
        elif 'input' in name or 'textfield' in name:
            return 'Input'
        elif 'card' in name:
            return 'Card'
        elif 'modal' in name or 'dialog' in name:
            return 'Modal'
        elif 'header' in name:
            return 'Header'
        elif 'footer' in name:
            return 'Footer'
        elif 'sidebar' in name:
            return 'Sidebar'
        elif 'nav' in name or 'menu' in name:
            return 'Navigation'
        elif node_type == 'TEXT':
            return 'Text'
        else:
            return 'Container'

    def extract_component_properties(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract component properties

        Args:
            node: Figma node

        Returns:
            Component properties
        """
        props = {}

        # Dimensions
        if 'absoluteBoundingBox' in node:
            box = node['absoluteBoundingBox']
            props['width'] = box.get('width')
            props['height'] = box.get('height')

        # Text content
        if node.get('type') == 'TEXT' and 'characters' in node:
            props['text'] = node['characters']

        # Styles
        if 'fills' in node and node['fills']:
            fill = node['fills'][0]
            if fill.get('type') == 'SOLID':
                props['backgroundColor'] = self.rgba_to_hex(fill.get('color', {}))

        return props

    def extract_component_names(self, node: Dict[str, Any]) -> List[str]:
        """
        Extract all component names used in screen

        Args:
            node: Screen node

        Returns:
            List of component names
        """
        components = set()

        def traverse(n):
            if n.get('type') == 'INSTANCE':
                components.add(n.get('name', 'Component'))
            for child in n.get('children', []):
                traverse(child)

        traverse(node)
        return sorted(list(components))

    def extract_node_styles(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract style properties from node

        Args:
            node: Figma node

        Returns:
            Style properties
        """
        styles = {}

        # Background
        if 'fills' in node and node['fills']:
            fill = node['fills'][0]
            if fill.get('type') == 'SOLID':
                styles['backgroundColor'] = self.rgba_to_hex(fill.get('color', {}))

        # Corner radius
        if 'cornerRadius' in node:
            styles['borderRadius'] = f"{node['cornerRadius']}px"

        return styles

    def extract_design_tokens(self, figma_data: Dict[str, Any]) -> Dict[str, Dict[str, str]]:
        """
        Extract design tokens (colors, spacing, typography)

        Args:
            figma_data: Figma file data

        Returns:
            Design tokens organized by category
        """
        tokens = {
            'colors': {},
            'spacing': {},
            'typography': {},
            'effects': {}
        }

        # Extract from styles
        if 'styles' in figma_data:
            for style_id, style in figma_data['styles'].items():
                style_type = style.get('styleType', '')
                name = style.get('name', '')

                # Colors
                if style_type == 'FILL':
                    if 'fills' in style and style['fills']:
                        color = self.rgba_to_hex(style['fills'][0].get('color', {}))
                        tokens['colors'][name] = color

                # Text styles (typography)
                elif style_type == 'TEXT':
                    tokens['typography'][name] = {
                        'fontFamily': style.get('fontFamily', 'Inter'),
                        'fontSize': f"{style.get('fontSize', 16)}px",
                        'fontWeight': style.get('fontWeight', 400),
                        'lineHeight': style.get('lineHeightPx', 'normal')
                    }

        # Extract common spacing values
        tokens['spacing'] = {
            'xs': '4px',
            'sm': '8px',
            'md': '16px',
            'lg': '24px',
            'xl': '32px',
            '2xl': '48px'
        }

        return tokens

    def rgba_to_hex(self, color: Dict[str, float]) -> str:
        """
        Convert RGBA color to hex

        Args:
            color: Figma color object {r, g, b, a}

        Returns:
            Hex color string
        """
        r = int(color.get('r', 0) * 255)
        g = int(color.get('g', 0) * 255)
        b = int(color.get('b', 0) * 255)

        return f"#{r:02x}{g:02x}{b:02x}".upper()

    def load_architect_specs(self, project_name: str) -> Dict[str, Dict[str, Any]]:
        """
        Load behavioral specs from architect session

        Args:
            project_name: Project name

        Returns:
            Dict mapping screen name to behavioral spec

        Raises:
            ArchitectSpecNotFoundError: If specs not found
        """
        session_dir = self.project_dir / ".sentra" / "architect-sessions" / project_name
        ui_screens_file = session_dir / "ui-screens.md"

        if not ui_screens_file.exists():
            raise ArchitectSpecNotFoundError(
                f"Architect UI screens spec not found: {ui_screens_file}\n"
                f"Please run voice architect to create behavioral specs first:\n"
                f"  /architect new --project \"{project_name}\" --voice"
            )

        # Parse ui-screens.md
        specs = self.parse_ui_screens_file(ui_screens_file)

        return specs

    def parse_ui_screens_file(self, file_path: Path) -> Dict[str, Dict[str, Any]]:
        """
        Parse ui-screens.md file to extract behavioral specs

        Expected format:
        ## Screen: Dashboard

        ### On Load
        - Fetch user's bookmarks
        - Show skeleton loading

        ### User Actions
        - **Click quick add button**: Opens QuickAddModal

        ### E2E Tests
        - **User adds first bookmark**:
          1. Navigate to /dashboard
          2. Click quick add button
          3. ...

        Args:
            file_path: Path to ui-screens.md

        Returns:
            Dict mapping screen name to behavioral spec
        """
        content = file_path.read_text()
        specs = {}

        # Split by screen sections
        screen_sections = re.split(r'^## Screen: (.+)$', content, flags=re.MULTILINE)

        # Parse each screen (skip first empty element)
        for i in range(1, len(screen_sections), 2):
            screen_name = screen_sections[i].strip()
            screen_content = screen_sections[i + 1] if i + 1 < len(screen_sections) else ''

            # Parse sections
            on_load = self.extract_list_section(screen_content, 'On Load')
            user_actions = self.extract_user_actions(screen_content)
            states = self.extract_list_section(screen_content, 'States')
            validation = self.extract_list_section(screen_content, 'Validation')
            error_handling = self.extract_list_section(screen_content, 'Error Handling')
            e2e_tests = self.extract_e2e_tests(screen_content)

            specs[screen_name] = {
                'on_load': on_load,
                'user_actions': user_actions,
                'states': states,
                'validation_rules': validation,
                'error_handling': error_handling,
                'e2e_tests': e2e_tests
            }

        return specs

    def extract_list_section(self, content: str, section_name: str) -> List[str]:
        """Extract bulleted list from section"""
        pattern = rf'### {section_name}\s*\n((?:[-*]\s+.+\n?)+)'
        match = re.search(pattern, content, re.MULTILINE)

        if not match:
            return []

        list_content = match.group(1)
        items = re.findall(r'^[-*]\s+(.+)$', list_content, re.MULTILINE)
        return [item.strip() for item in items]

    def extract_user_actions(self, content: str) -> List[Dict[str, str]]:
        """Extract user actions with trigger and result"""
        pattern = r'### User Actions\s*\n((?:[-*]\s+\*\*.+\*\*:.+\n?)+)'
        match = re.search(pattern, content, re.MULTILINE)

        if not match:
            return []

        list_content = match.group(1)
        actions = []

        # Parse each action: **Action**: Result
        for line in list_content.split('\n'):
            action_match = re.match(r'^[-*]\s+\*\*(.+?)\*\*:\s*(.+)$', line.strip())
            if action_match:
                actions.append({
                    'action': action_match.group(1).strip(),
                    'result': action_match.group(2).strip()
                })

        return actions

    def extract_e2e_tests(self, content: str) -> List[Dict[str, Any]]:
        """Extract E2E test scenarios"""
        pattern = r'### E2E Tests?\s*\n((?:[-*]\s+\*\*.+\*\*:.*\n(?:\s+\d+\..+\n?)+)+)'
        match = re.search(pattern, content, re.MULTILINE | re.DOTALL)

        if not match:
            return []

        test_content = match.group(1)
        tests = []

        # Parse each test
        test_blocks = re.split(r'^[-*]\s+\*\*(.+?)\*\*:', test_content, flags=re.MULTILINE)

        for i in range(1, len(test_blocks), 2):
            test_name = test_blocks[i].strip()
            test_steps_text = test_blocks[i + 1] if i + 1 < len(test_blocks) else ''

            # Extract numbered steps
            steps = re.findall(r'^\s+\d+\.\s+(.+)$', test_steps_text, re.MULTILINE)

            tests.append({
                'name': test_name,
                'description': test_name,
                'steps': [step.strip() for step in steps],
                'assertions': []  # Could be extracted from steps
            })

        return tests

    def create_screen_spec(
        self,
        screen: Dict[str, Any],
        behavior: Dict[str, Any],
        design_tokens: Dict[str, Dict[str, str]],
        figma_url: str,
        file_id: str
    ) -> ScreenSpec:
        """
        Create complete screen specification

        Args:
            screen: Parsed screen from Figma
            behavior: Behavioral spec from architect
            design_tokens: Extracted design tokens
            figma_url: Original Figma URL
            file_id: Figma file ID

        Returns:
            Complete screen specification
        """
        from datetime import datetime

        # Infer route from screen name
        route = self.infer_route(screen['name'])

        # Find V0 export if exists
        v0_source = self.find_v0_export(screen['name'])

        # Create behavior object
        behavior_obj = ScreenBehavior(
            on_load=behavior.get('on_load', []),
            user_actions=behavior.get('user_actions', []),
            states=behavior.get('states', []),
            validation_rules=behavior.get('validation_rules', []),
            error_handling=behavior.get('error_handling', [])
        )

        # Create E2E tests
        e2e_tests = [
            E2ETest(
                name=test['name'],
                description=test.get('description', test['name']),
                steps=test.get('steps', []),
                assertions=test.get('assertions', [])
            )
            for test in behavior.get('e2e_tests', [])
        ]

        return ScreenSpec(
            screen=screen['name'],
            route=route,
            figma_url=figma_url,
            v0_source=v0_source,
            layout=screen['layout'],
            components=screen['components'],
            behavior=behavior_obj,
            e2e_tests=e2e_tests,
            design_tokens=design_tokens,
            created_at=datetime.now().isoformat(),
            figma_file_id=file_id,
            figma_node_id=screen['id']
        )

    def infer_route(self, screen_name: str) -> str:
        """
        Infer route from screen name

        Args:
            screen_name: Screen name

        Returns:
            Route path
        """
        # Convert to kebab-case and lowercase
        route = screen_name.lower()
        route = re.sub(r'[^a-z0-9]+', '-', route)
        route = route.strip('-')

        # Special cases
        if route == 'home' or route == 'landing':
            return '/'

        return f'/{route}'

    def find_v0_export(self, screen_name: str) -> Optional[str]:
        """
        Find corresponding V0 export file

        Args:
            screen_name: Screen name

        Returns:
            Path to V0 export or None
        """
        v0_dir = self.project_dir / "docs" / "specs" / "v0-exports"

        if not v0_dir.exists():
            return None

        # Try exact match
        filename = self.sanitize_filename(screen_name)
        for ext in ['.tsx', '.jsx', '.md']:
            file_path = v0_dir / f"{filename}{ext}"
            if file_path.exists():
                return str(file_path.relative_to(self.project_dir))

        return None

    def sanitize_filename(self, name: str) -> str:
        """
        Sanitize screen name for filename

        Args:
            name: Screen name

        Returns:
            Safe filename
        """
        # Convert to kebab-case
        filename = name.lower()
        filename = re.sub(r'[^a-z0-9]+', '-', filename)
        filename = filename.strip('-')
        return filename

    def write_spec(self, spec: ScreenSpec, output_file: Path):
        """
        Write screen spec to YAML file

        Args:
            spec: Screen specification
            output_file: Output file path
        """
        # Convert dataclasses to dicts
        spec_dict = {
            'screen': spec.screen,
            'route': spec.route,
            'figma_url': spec.figma_url,
            'v0_source': spec.v0_source,
            'layout': spec.layout,
            'components': spec.components,
            'behavior': {
                'on_load': spec.behavior.on_load,
                'user_actions': spec.behavior.user_actions,
                'states': spec.behavior.states,
                'validation_rules': spec.behavior.validation_rules,
                'error_handling': spec.behavior.error_handling
            },
            'e2e_tests': [
                {
                    'name': test.name,
                    'description': test.description,
                    'steps': test.steps,
                    'assertions': test.assertions
                }
                for test in spec.e2e_tests
            ],
            'design_tokens': spec.design_tokens,
            'metadata': {
                'created_at': spec.created_at,
                'figma_file_id': spec.figma_file_id,
                'figma_node_id': spec.figma_node_id
            }
        }

        with open(output_file, 'w') as f:
            yaml.dump(spec_dict, f, default_flow_style=False, sort_keys=False, allow_unicode=True)


def main():
    """Main entry point"""

    parser = argparse.ArgumentParser(
        description="Figma → Sentra Import: Merge Figma designs with behavioral specs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Import entire Figma file
  python .sentra/scripts/figma-import.py \\
    --figma-url https://figma.com/file/abc123/BookmarkManager \\
    --project bookmark-manager

  # Import specific frame
  python .sentra/scripts/figma-import.py \\
    --figma-url https://figma.com/file/abc123/App?node-id=123:456 \\
    --project my-app \\
    --output ./specs/screens

Environment:
  FIGMA_ACCESS_TOKEN    Figma personal access token (required)
                        Get yours at: https://www.figma.com/settings

Notes:
  - Requires architect session with ui-screens.md
  - Screen names in Figma must match architect spec names
  - Generates complete YAML specs ready for agent consumption
        """
    )

    parser.add_argument(
        '--figma-url',
        required=True,
        help='Figma file URL'
    )

    parser.add_argument(
        '--project',
        required=True,
        help='Project name (for architect session lookup)'
    )

    parser.add_argument(
        '--output',
        type=Path,
        help='Output directory for specs (default: docs/specs/screens/)'
    )

    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Enable verbose logging'
    )

    args = parser.parse_args()

    # Configure logging
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # Load environment variables
    load_dotenv()

    # Get Figma access token
    access_token = os.getenv('FIGMA_ACCESS_TOKEN')
    if not access_token:
        logger.error("Error: FIGMA_ACCESS_TOKEN environment variable not set")
        logger.error("\nGet your token at: https://www.figma.com/settings")
        logger.error("Then add to .env file: FIGMA_ACCESS_TOKEN=your_token_here")
        sys.exit(1)

    # Get project directory
    project_dir = Path.cwd()

    try:
        # Create importer
        importer = FigmaImporter(access_token, project_dir)

        # Run import
        generated_files = importer.import_design(
            figma_url=args.figma_url,
            project_name=args.project,
            output_dir=args.output
        )

        # Success
        logger.info("")
        logger.info("Next steps:")
        logger.info("  1. Review generated specs in docs/specs/screens/")
        logger.info("  2. Run meta-orchestrator to create GitHub issues")
        logger.info("  3. Let AI agents build the screens!")

        sys.exit(0)

    except FigmaAPIError as e:
        logger.error(f"Figma API Error: {e}")
        sys.exit(1)

    except ArchitectSpecNotFoundError as e:
        logger.error(str(e))
        sys.exit(1)

    except ValueError as e:
        logger.error(f"Invalid input: {e}")
        sys.exit(1)

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
