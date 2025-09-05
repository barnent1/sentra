# Advanced TMUX CLI System with Integrated Claude Code

**Comprehensive Multi-Project Development Environment** that seamlessly integrates with Claude Code to provide unprecedented development orchestration capabilities.

## Core CLI Commands

### Session Management
```bash
sentra session [session-name]     # Create or attach to named session
sentra session list               # Show all active sessions
sentra session kill [session]    # Terminate specific session
sentra session switch [session]  # Switch between sessions
sentra session status            # Show current session details
```

### Project Management
```bash
sentra create [project-name]     # Add project to active session (auto-opens in new pane)
sentra clone [git-url] [name]    # Clone and setup existing project
sentra open [project-name]       # Switch to existing project pane
sentra close [project-name]      # Close project pane (with confirmation)
sentra list                      # Show all projects in current session
sentra info [project-name]       # Show detailed project information
```

### Agent & Orchestration Control
```bash
sentra agents                    # Show all active agents for current project
sentra orchestrator status       # Show orchestrator activity across all projects
sentra task list                 # Show current task queue
sentra task create "description" # Create new task for active project
sentra approve [task-id]         # Approve pending agent action
sentra reject [task-id]          # Reject pending agent action
sentra pause [project-name]      # Pause all agents for specific project
sentra resume [project-name]     # Resume agents for specific project
```

### Real-time Monitoring
```bash
sentra watch [project-name]      # Real-time log streaming for project
sentra logs [project-name]       # Show recent activity logs
sentra dashboard                 # Open web dashboard in browser
sentra voice toggle              # Enable/disable voice notifications
sentra alerts                   # Show pending alerts/approvals
```

### Claude Code Integration
```bash
sentra code [project-name]       # Launch Claude Code in project directory
sentra code status              # Show Claude Code connection status
sentra code restart             # Restart Claude Code session
sentra sync                     # Sync local changes with orchestrator
```

## TMUX Pane Architecture

Each session manages up to 4 projects with intelligent pane layout:

```
┌─────────────────┬─────────────────┐
│   Project 1     │   Project 2     │
│ [Claude Code]   │ [Claude Code]   │
│ [Agent Logs]    │ [Agent Logs]    │
├─────────────────┼─────────────────┤
│   Project 3     │   Project 4     │
│ [Claude Code]   │ [Claude Code]   │
│ [Agent Logs]    │ [Agent Logs]    │
└─────────────────┴─────────────────┘
```

## Per-Project Pane Features

### Claude Code Terminal Integration
- **Live Command Streaming:** See every Claude Code command as it executes
- **Real-time File Changes:** Watch files being created, modified, and deleted
- **Agent Communication:** View agent-to-agent coordination messages
- **Build Process Monitoring:** See compilation, testing, and deployment in real-time
- **Error Highlighting:** Immediate visual feedback on compilation errors or failures

### Advanced Pane Management
```bash
sentra layout grid              # 2x2 grid layout (default)
sentra layout vertical          # Vertical split for 2 projects
sentra layout horizontal        # Horizontal split for 2 projects  
sentra layout single [project]  # Focus on single project (full screen)
sentra layout restore           # Return to previous layout
```

### Session Persistence & Recovery
```bash
sentra save [session-name]      # Save session state to disk
sentra restore [session-name]   # Restore saved session
sentra backup                   # Backup all sessions and project states
sentra sessions history         # Show recently closed sessions
```

## Intelligent Features

### Auto-Discovery & Setup
- **Project Type Detection:** Automatically identify Next.js, React, Node.js, etc.
- **Environment Setup:** Auto-install dependencies and configure development environment
- **Git Integration:** Automatic git status, branch tracking, and commit monitoring
- **Port Management:** Auto-assign development ports to prevent conflicts

### Context-Aware Commands
```bash
sentra deploy                   # Deploy current project using Sentra UP
sentra test                     # Run project-specific test suite
sentra build                    # Build current project
sentra dev                      # Start development server for current project
sentra status                   # Show comprehensive project status
```

### Multi-Session Scaling
```bash
sentra sessions max 5           # Set maximum concurrent sessions
sentra sessions balance         # Redistribute projects across sessions for optimal performance
sentra sessions merge [s1] [s2] # Merge two sessions if capacity allows
sentra sessions split [session] # Split session into two sessions
```

## Real-time Dashboard Integration

### Bi-directional Sync
- **CLI Actions → Dashboard:** CLI actions immediately reflected in web dashboard
- **Dashboard → CLI:** Web dashboard actions update CLI display
- **Mobile Notifications:** Push notifications to PWA when CLI actions occur
- **Voice Integration:** Voice commands can control CLI operations
- **Remote Access:** Access CLI session from web dashboard for remote work

## Advanced Monitoring & Alerts

### System Resource Monitoring
```bash
sentra monitor cpu              # Show CPU usage across all projects
sentra monitor memory           # Show memory usage breakdown
sentra monitor network          # Show network activity and API calls
sentra alerts config            # Configure alert thresholds
sentra alerts mute [duration]   # Temporarily mute notifications
```

### Agent Performance Tracking
```bash
sentra agent stats [agent-id]   # Show agent performance metrics
sentra agent history            # Show agent task completion history
sentra orchestrator metrics     # Show orchestrator efficiency stats
sentra conflicts                # Show any detected or resolved conflicts
```

## Collaboration Features

### Multi-User Support
```bash
sentra share [session-name]     # Generate shareable session URL
sentra invite [email]           # Invite collaborator to session
sentra permissions [user] [level] # Set user permission levels
sentra handoff [user]           # Transfer session ownership
```

### Team Coordination
```bash
sentra team status              # Show all team member sessions
sentra team message "text"      # Broadcast message to team
sentra team sync                # Synchronize team project states
```

## Development Workflow Integration

### Git & Version Control
```bash
sentra commit [project] "msg"   # Intelligent commit with agent-generated summary
sentra branch [project] [name]  # Create and switch to new branch
sentra merge [project] [branch] # Merge with conflict resolution assistance
sentra release [project] [tag]  # Create release with automated changelog
```

### Intelligent Automation
```bash
sentra auto-commit [project]    # Enable automatic commits when agents complete tasks
sentra auto-test [project]      # Run tests automatically on code changes
sentra auto-deploy [project]    # Deploy automatically when validation passes
sentra workflows list           # Show available automated workflows
```

## CLI Configuration & Customization

### Personal Settings
```bash
sentra config set [key] [value] # Set configuration options
sentra config theme [dark|light] # Set CLI theme
sentra config notifications [on|off] # Toggle notifications
sentra alias create [name] [command] # Create custom command aliases
```

### Extensions & Plugins
```bash
sentra plugins list             # Show available CLI plugins
sentra plugins install [plugin] # Install CLI extensions
sentra plugins create [name]    # Create custom plugin
sentra hooks list               # Show available lifecycle hooks
```

## Emergency & Recovery Commands

### Crisis Management
```bash
sentra emergency stop           # Emergency stop all agents
sentra emergency backup         # Emergency backup all project states
sentra emergency restore        # Restore from emergency backup
sentra doctor                   # Diagnose and fix common issues
sentra cleanup                  # Clean up orphaned processes and files
```

### System Recovery
```bash
sentra recover session [name]   # Recover crashed session
sentra recover project [name]   # Recover project from backup
sentra repair database          # Repair database connections
sentra reset [component]        # Reset specific system components
```

## Performance & Resource Management

### Optimization Features
- **Smart Resource Allocation:** Automatically adjust resources based on project needs
- **Background Process Management:** Monitor and manage all spawned processes
- **Memory Optimization:** Intelligent cleanup of unused resources
- **Network Traffic Control:** Monitor and limit network usage per project

### Performance Monitoring
```bash
sentra perf                     # Show overall system performance
sentra perf project [name]      # Show project-specific performance metrics
sentra perf agents              # Show agent performance statistics
sentra perf history             # Show performance trends over time
```

## Integration with Orchestrator

### Coordination Features
- **Task Delegation:** CLI can request specific tasks from orchestrator
- **Status Reporting:** Real-time status updates from orchestrator to CLI
- **Conflict Resolution:** CLI alerts when orchestrator detects conflicts
- **Performance Metrics:** Display orchestrator efficiency and throughput stats

### Advanced Orchestration
```bash
sentra orchestrator assign [agent] [task] # Manual task assignment
sentra orchestrator rebalance   # Request workload rebalancing
sentra orchestrator priorities  # Show current task priorities
sentra orchestrator conflicts   # Show conflict detection status
```

## Implementation Notes

### Technical Architecture
- **TMUX API Integration:** Programmatic pane and window management
- **WebSocket Connections:** Real-time communication with server
- **State Synchronization:** Local and server state management
- **Claude Code MCP:** Deep integration with Claude Code's MCP servers
- **Cross-Platform:** Works on macOS, Linux, and Windows (WSL)

### Performance Considerations
- **Efficient Rendering:** Smart terminal updates to minimize flicker
- **Background Processing:** Non-blocking command execution
- **Resource Management:** Intelligent cleanup and optimization
- **Network Efficiency:** Compressed communication protocols

---

**Next Document:** [03-OBSERVABILITY-DASHBOARD.md](03-OBSERVABILITY-DASHBOARD.md) - Real-time Multi-Agent Monitoring