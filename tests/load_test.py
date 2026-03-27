#!/usr/bin/env python3
"""
Load test script for Skilltoon
Creates mock data to test performance with large numbers of skills
"""

import os
import tempfile
import shutil
import random
import string
import time

def create_mock_skill(base_path, skill_name, num_files=10):
    """Create a mock skill directory with random files"""
    skill_path = os.path.join(base_path, skill_name)
    os.makedirs(skill_path, exist_ok=True)
    
    for i in range(num_files):
        filename = f"file_{i}.txt"
        content = ''.join(random.choices(string.ascii_letters + string.digits, k=1000))
        with open(os.path.join(skill_path, filename), 'w') as f:
            f.write(content)
    
    # Create a SKILL.md
    with open(os.path.join(skill_path, "SKILL.md"), 'w') as f:
        f.write(f"# {skill_name}\n\nMock skill for testing.\n")
    
    return skill_path

def setup_test_environment(num_skills=50, num_agents=3):
    """Setup test environment with mock data"""
    base_dir = tempfile.mkdtemp(prefix="asm_load_test_")
    
    # Create central hub
    hub_path = os.path.join(base_dir, ".agents", "skills")
    os.makedirs(hub_path, exist_ok=True)
    
    # Create skills in hub
    print(f"Creating {num_skills} mock skills...")
    for i in range(num_skills):
        skill_name = f"test-skill-{i:03d}"
        create_mock_skill(hub_path, skill_name)
    
    # Create agent directories
    agents = []
    for i in range(num_agents):
        agent_name = f"agent-{i}"
        agent_path = os.path.join(base_dir, f".{agent_name}", "skills")
        os.makedirs(agent_path, exist_ok=True)
        agents.append({
            "name": agent_name,
            "path": agent_path
        })
    
    print(f"Test environment created at: {base_dir}")
    print(f"  Hub: {hub_path}")
    print(f"  Agents: {len(agents)}")
    
    return base_dir, hub_path, agents

def cleanup(base_dir):
    """Clean up test environment"""
    print(f"Cleaning up: {base_dir}")
    shutil.rmtree(base_dir)

if __name__ == "__main__":
    import sys
    
    num_skills = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    num_agents = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    print(f"Setting up load test environment...")
    print(f"  Skills: {num_skills}")
    print(f"  Agents: {num_agents}")
    
    base_dir, hub_path, agents = setup_test_environment(num_skills, num_agents)
    
    print("\nTest environment ready!")
    print(f"\nTo test with this data:")
    print(f"1. Set central hub path to: {hub_path}")
    print(f"2. Add agents with paths:")
    for agent in agents:
        print(f"   - {agent['name']}: {agent['path']}")
    
    input("\nPress Enter to cleanup...")
    cleanup(base_dir)
