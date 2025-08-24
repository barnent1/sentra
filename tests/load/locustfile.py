"""
SENTRA Load Testing with Locust
Comprehensive performance testing scenarios for production validation
"""

import json
import random
import time
from datetime import datetime
from typing import Dict, Any

from locust import HttpUser, TaskSet, task, between, events
from locust.contrib.fasthttp import FastHttpUser


class AuthenticationTasks(TaskSet):
    """Authentication-related load testing tasks"""
    
    def on_start(self):
        """Initialize authentication session"""
        self.auth_token = None
        self.user_id = None
        self.login()
    
    def login(self):
        """Perform user login"""
        email = f"loadtest-{int(time.time())}-{random.randint(1000, 9999)}@sentra.com"
        password = "LoadTest123!"
        
        response = self.client.post("/api/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("token")
            self.user_id = data.get("user", {}).get("id")
            
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        if self.auth_token:
            return {"Authorization": f"Bearer {self.auth_token}"}
        return {}
    
    @task(5)
    def verify_token(self):
        """Verify authentication token"""
        self.client.get("/api/auth/me", headers=self.get_auth_headers())
    
    @task(2)
    def refresh_token(self):
        """Refresh authentication token"""
        self.client.post("/api/auth/refresh", headers=self.get_auth_headers())
    
    @task(1)
    def logout(self):
        """User logout"""
        self.client.post("/api/auth/logout", headers=self.get_auth_headers())


class ProjectManagementTasks(TaskSet):
    """Project management load testing tasks"""
    
    def on_start(self):
        """Initialize project management session"""
        self.auth_token = self.parent.auth_token
        self.projects = []
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        if self.auth_token:
            return {"Authorization": f"Bearer {self.auth_token}"}
        return {}
    
    @task(10)
    def list_projects(self):
        """List user projects"""
        response = self.client.get("/api/projects", headers=self.get_auth_headers())
        if response.status_code == 200:
            self.projects = response.json().get("data", [])
    
    @task(5)
    def create_project(self):
        """Create a new project"""
        project_names = [
            "E-commerce Platform", "Social Media App", "Data Analytics Dashboard",
            "Mobile Banking App", "IoT Management System", "Content Management System"
        ]
        
        languages = ["javascript", "typescript", "python", "java", "go", "rust"]
        
        project_data = {
            "name": f"{random.choice(project_names)} {random.randint(1000, 9999)}",
            "description": "Project created during load testing",
            "language": random.choice(languages),
            "framework": random.choice(["react", "vue", "angular", "express"]),
            "complexity": random.choice(["simple", "medium", "complex"])
        }
        
        response = self.client.post("/api/projects", 
                                  headers=self.get_auth_headers(),
                                  json=project_data)
        
        if response.status_code == 201:
            project = response.json()
            self.projects.append(project)
    
    @task(8)
    def get_project_details(self):
        """Get specific project details"""
        if self.projects:
            project = random.choice(self.projects)
            self.client.get(f"/api/projects/{project['id']}", 
                          headers=self.get_auth_headers())
    
    @task(3)
    def update_project(self):
        """Update project information"""
        if self.projects:
            project = random.choice(self.projects)
            update_data = {
                "description": f"Updated during load test at {datetime.now()}"
            }
            self.client.put(f"/api/projects/{project['id']}", 
                          headers=self.get_auth_headers(),
                          json=update_data)
    
    @task(2)
    def delete_project(self):
        """Delete a project"""
        if len(self.projects) > 5:  # Keep some projects for testing
            project = self.projects.pop()
            self.client.delete(f"/api/projects/{project['id']}", 
                             headers=self.get_auth_headers())


class AgentOrchestrationTasks(TaskSet):
    """Agent orchestration load testing tasks"""
    
    def on_start(self):
        """Initialize agent orchestration session"""
        self.auth_token = self.parent.auth_token
        self.tasks = []
        self.agents = []
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        if self.auth_token:
            return {"Authorization": f"Bearer {self.auth_token}"}
        return {}
    
    @task(5)
    def list_agents(self):
        """List available agents"""
        response = self.client.get("/api/agents", headers=self.get_auth_headers())
        if response.status_code == 200:
            self.agents = response.json().get("data", [])
    
    @task(8)
    def create_agent_task(self):
        """Create a new agent task"""
        agent_types = [
            "code-analyzer", "code-reviewer", "test-automator",
            "documentation-generator", "security-scanner", "performance-optimizer"
        ]
        
        task_data = {
            "agentType": random.choice(agent_types),
            "projectId": f"proj_{random.randint(1000, 9999)}",
            "priority": random.randint(1, 5),
            "config": {
                "analysisType": random.choice(["quick", "standard", "comprehensive"]),
                "includeTests": random.choice([True, False]),
                "timeout": random.randint(300, 3600)
            }
        }
        
        response = self.client.post("/api/agents/tasks",
                                  headers=self.get_auth_headers(),
                                  json=task_data)
        
        if response.status_code == 201:
            task = response.json()
            self.tasks.append(task)
    
    @task(10)
    def check_task_status(self):
        """Check status of agent tasks"""
        if self.tasks:
            task = random.choice(self.tasks)
            self.client.get(f"/api/agents/tasks/{task['taskId']}", 
                          headers=self.get_auth_headers())
    
    @task(3)
    def cancel_task(self):
        """Cancel an agent task"""
        if len(self.tasks) > 3:  # Keep some tasks for testing
            task = self.tasks.pop()
            self.client.delete(f"/api/agents/tasks/{task['taskId']}", 
                             headers=self.get_auth_headers())


class DashboardTasks(TaskSet):
    """Dashboard and analytics load testing tasks"""
    
    def on_start(self):
        """Initialize dashboard session"""
        self.auth_token = self.parent.auth_token
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        if self.auth_token:
            return {"Authorization": f"Bearer {self.auth_token}"}
        return {}
    
    @task(15)
    def get_dashboard_metrics(self):
        """Get dashboard metrics"""
        self.client.get("/api/dashboard/metrics", headers=self.get_auth_headers())
    
    @task(10)
    def get_activity_feed(self):
        """Get activity feed"""
        params = {
            "limit": random.randint(10, 50),
            "page": random.randint(1, 5)
        }
        self.client.get("/api/dashboard/activity", 
                       headers=self.get_auth_headers(),
                       params=params)
    
    @task(8)
    def get_project_statistics(self):
        """Get project statistics"""
        project_id = f"proj_{random.randint(1000, 9999)}"
        self.client.get(f"/api/projects/{project_id}/stats", 
                       headers=self.get_auth_headers())
    
    @task(5)
    def get_system_health(self):
        """Check system health"""
        self.client.get("/api/health", headers=self.get_auth_headers())


class RealTimeUpdatesTasks(TaskSet):
    """Real-time updates and WebSocket simulation tasks"""
    
    def on_start(self):
        """Initialize real-time session"""
        self.auth_token = self.parent.auth_token
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        if self.auth_token:
            return {"Authorization": f"Bearer {self.auth_token}"}
        return {}
    
    @task(10)
    def subscribe_to_updates(self):
        """Subscribe to project updates"""
        project_id = f"proj_{random.randint(1000, 9999)}"
        self.client.get(f"/api/projects/{project_id}/updates", 
                       headers=self.get_auth_headers())
    
    @task(5)
    def trigger_update(self):
        """Trigger a project update"""
        project_id = f"proj_{random.randint(1000, 9999)}"
        update_data = {
            "updateType": random.choice(["status", "progress", "completion"]),
            "message": "Update triggered during load test"
        }
        self.client.post(f"/api/projects/{project_id}/trigger-update",
                        headers=self.get_auth_headers(),
                        json=update_data)


class SentraUser(FastHttpUser):
    """Main user class for SENTRA load testing"""
    
    # Weight distribution for different task sets
    tasks = [
        (AuthenticationTasks, 1),
        (ProjectManagementTasks, 3),
        (AgentOrchestrationTasks, 2),
        (DashboardTasks, 2),
        (RealTimeUpdatesTasks, 1)
    ]
    
    # Wait time between tasks (human-like behavior)
    wait_time = between(1, 5)
    
    def on_start(self):
        """Initialize user session"""
        self.auth_token = None
        self.user_id = None
        self.session_start = time.time()
        
        # Perform initial authentication
        self.authenticate()
    
    def authenticate(self):
        """Authenticate user"""
        email = f"loadtest-{int(time.time())}-{random.randint(1000, 9999)}@sentra.com"
        password = "LoadTest123!"
        
        with self.client.post("/api/auth/login", json={
            "email": email,
            "password": password
        }, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                self.user_id = data.get("user", {}).get("id")
                response.success()
            else:
                response.failure(f"Authentication failed: {response.status_code}")
    
    def on_stop(self):
        """Cleanup on user stop"""
        session_duration = time.time() - self.session_start
        print(f"User session duration: {session_duration:.2f} seconds")


class AdminUser(SentraUser):
    """Admin user with elevated permissions"""
    
    weight = 1  # Fewer admin users
    
    tasks = [
        (AuthenticationTasks, 1),
        (ProjectManagementTasks, 2),
        (AgentOrchestrationTasks, 3),
        (DashboardTasks, 4),
        (RealTimeUpdatesTasks, 2)
    ]
    
    def authenticate(self):
        """Authenticate as admin user"""
        email = f"admin-{int(time.time())}-{random.randint(1000, 9999)}@sentra.com"
        password = "AdminTest123!"
        
        with self.client.post("/api/auth/login", json={
            "email": email,
            "password": password,
            "role": "admin"
        }, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                self.user_id = data.get("user", {}).get("id")
                response.success()
            else:
                response.failure(f"Admin authentication failed: {response.status_code}")


# Event handlers for custom metrics
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Initialize test metrics"""
    print("Starting SENTRA load test...")
    print(f"Target URL: {environment.host}")
    print(f"Users: {environment.runner.user_count}")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Cleanup after test completion"""
    print("SENTRA load test completed")
    print(f"Total requests: {environment.runner.stats.total.num_requests}")
    print(f"Total failures: {environment.runner.stats.total.num_failures}")


@events.request.add_listener
def record_custom_metrics(request_type, name, response_time, response_length, response, context, exception, **kwargs):
    """Record custom metrics for detailed analysis"""
    if exception:
        # Log errors for analysis
        print(f"Request error: {request_type} {name} - {exception}")
    
    # Record slow requests
    if response_time > 2000:  # 2 seconds threshold
        print(f"Slow request detected: {request_type} {name} - {response_time}ms")