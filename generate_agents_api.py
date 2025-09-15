#!/usr/bin/env python3
"""
Generate a lightweight agents API endpoint from components.json
This creates docs/api/agents.json for the CLI tool to use
"""

import json
import os
import yaml

def generate_agents_api():
    """Generate the agents API file from components.json"""
    
    # Read the components.json file
    components_path = 'docs/components.json'
    output_path = 'docs/api/agents.json'

    # Build list of approved agent categories from directory structure
    agents_dir = os.path.join('cli-tool', 'components', 'agents')
    approved_categories = [
        d for d in os.listdir(agents_dir) if os.path.isdir(os.path.join(agents_dir, d))
    ] if os.path.isdir(agents_dir) else []
    
    if not os.path.exists(components_path):
        print(f"Error: {components_path} not found")
        return False
    
    try:
        with open(components_path, 'r', encoding='utf-8') as f:
            components_data = json.load(f)
        
        # Extract agents and format them for the API
        agents = []
        if 'agents' in components_data:
            for agent in components_data['agents']:
                # Parse category from YAML front matter if available
                category = None
                content = agent.get('content', '')
                if isinstance(content, str) and content.startswith('---'):
                    parts = content.split('---', 2)
                    if len(parts) >= 3:
                        try:
                            fm = yaml.safe_load(parts[1]) or {}
                            category = fm.get('category')
                        except yaml.YAMLError as e:
                            print(f"Warning: Invalid YAML in {agent.get('path')}: {e}")

                # Fall back to existing category field or path
                if not category:
                    category = agent.get('category')
                if not category:
                    path_parts = agent['path'].split('/')
                    category = path_parts[0] if len(path_parts) > 1 else 'root'

                if category not in approved_categories:
                    raise ValueError(
                        f"Invalid category '{category}' for agent {agent.get('path')}. "
                        f"Approved categories: {approved_categories}"
                    )

                name = os.path.basename(agent['path'])
                if name.endswith('.md'):
                    name = name[:-3]

                agents.append({
                    'name': name,
                    'path': agent['path'].replace('.md', ''),  # Remove .md from path too
                    'category': category,
                    'description': agent.get('description', '')[:100]  # Truncate description for size
                })
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Write the API file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                'agents': agents,
                'version': '1.0.0',
                'total': len(agents)
            }, f, indent=2)
        
        print(f"✅ Generated agents API with {len(agents)} agents")
        print(f"📄 Output: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error generating agents API: {e}")
        return False

if __name__ == '__main__':
    generate_agents_api()
