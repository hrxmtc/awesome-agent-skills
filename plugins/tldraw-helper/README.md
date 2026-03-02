# tldraw Helper Plugin

A comprehensive Claude Code plugin for creating diagrams and visualizations using tldraw Desktop's Local Canvas API.

## Overview

This plugin enables programmatic control of tldraw Desktop, allowing you to create professional diagrams, flowcharts, architecture diagrams, and more through simple commands and AI assistance.

## Prerequisites

- **tldraw Desktop** must be installed and running
- The Local Canvas API server runs on port 7236 by default
- At least one document must be open in tldraw Desktop

## Installation

This plugin is included in the awesome-agent-skills marketplace.

```bash
# Add the marketplace
/plugin marketplace add likai/awesome-agent-skills

# Install the plugin
/plugin install tldraw-helper
```

## Features

### 📚 Skills

- **tldraw-canvas-api** - Complete guide to using the tldraw Canvas API
  - Shape types and properties
  - API endpoints and usage
  - Best practices and examples
  - Troubleshooting guide

### ⚡ Commands

- `/tldraw:draw [type] [description]` - Create diagrams interactively
- `/tldraw:screenshot [size] [output]` - Capture canvas screenshots
- `/tldraw:list` - List all shapes on the canvas
- `/tldraw:clear` - Clear all shapes from the canvas

### 🤖 Agent

- **diagram-creator** - Autonomous agent for creating complex diagrams
  - Understands requirements through conversation
  - Plans layout and structure
  - Creates diagrams incrementally
  - Refines based on feedback

## Quick Start

### 1. Start tldraw Desktop

Launch tldraw Desktop and create a new document (Cmd+N / Ctrl+N).

### 2. Create Your First Diagram

```
/tldraw:draw flowchart user login process
```

The AI will:
1. Check for open documents
2. Create a flowchart showing the login process
3. Take a screenshot to show you the result

### 3. Take Screenshots

```
/tldraw:screenshot large
```

Captures the current canvas as a high-resolution image.

### 4. List Shapes

```
/tldraw:list
```

Shows all shapes currently on the canvas with their properties.

## Usage Examples

### Creating a Flowchart

```
/tldraw:draw flowchart order processing system
```

Creates a flowchart with:
- Start/end points (ellipses)
- Process steps (rectangles)
- Decision points (diamonds)
- Arrows connecting the flow

### Creating an Architecture Diagram

```
/tldraw:draw architecture microservices e-commerce platform
```

Creates an architecture diagram with:
- API Gateway
- Microservices (Auth, User, Order, Payment)
- Databases
- External services
- Connections between components

### Creating a Mind Map

```
/tldraw:draw mindmap project planning
```

Creates a mind map with:
- Central topic
- Main branches
- Sub-topics
- Color-coded categories

### Using Natural Language

You can also just describe what you want:

```
Draw a diagram showing how AI training works, including data input,
preprocessing, neural network, backpropagation, and validation
```

The AI will understand and create an appropriate diagram.

## Supported Diagram Types

- **Flowcharts** - Process flows and workflows
- **Architecture** - System architecture and components
- **Mind Maps** - Concept maps and brainstorming
- **Sequence** - Sequence diagrams and interactions
- **ER Diagrams** - Entity-relationship models
- **Network** - Network topology diagrams
- **Timeline** - Timeline visualizations
- **Custom** - Any custom visualization you can describe

## Shape Types

### Geometric Shapes
- Rectangle, Ellipse, Triangle, Diamond
- Hexagon, Pentagon, Octagon
- Star, Heart, Cloud, Pill
- Arrows (various directions)

### Special Shapes
- Text labels
- Arrows and lines
- Sticky notes
- Custom paths

### Colors
- Primary: red, green, blue
- Light variants: light-red, light-green, light-blue
- Others: orange, yellow, violet, grey, black, white

### Fill Styles
- None, Tint, Background, Solid, Pattern

## API Reference

### Check for Documents

```bash
curl -s http://localhost:7236/api/doc | jq .
```

### Create Shapes

```bash
curl -X POST "http://localhost:7236/api/doc/DOC_ID/actions" \
  -H 'Content-Type: application/json' \
  -d '{"actions": [...]}'
```

### Get Shapes

```bash
curl -s "http://localhost:7236/api/doc/DOC_ID/shapes" | jq .
```

### Take Screenshot

```bash
curl -s "http://localhost:7236/api/doc/DOC_ID/screenshot?size=medium" \
  -o output.jpg
```

## Best Practices

1. **Start Simple** - Create basic structure first, then add details
2. **Use Grid Layout** - Position shapes at multiples of 50 for alignment
3. **Consistent Spacing** - Keep 150-200px between major components
4. **Color Coding** - Use colors consistently to convey meaning
5. **Incremental Creation** - Build in sections, verify with screenshots
6. **Meaningful IDs** - Use descriptive shape IDs for easy reference

## Troubleshooting

### "No documents found"
- Create a new document in tldraw Desktop (Cmd+N / Ctrl+N)
- Or open an existing .tldr file

### "Connection refused"
- Verify tldraw Desktop is running
- Check server.json: `cat ~/Library/Application\ Support/tldraw/server.json`

### "JSON parsing errors"
- Use JSON files instead of inline JSON
- Validate JSON syntax before sending

### Shapes not appearing
- Check response for error messages
- Verify coordinates are reasonable
- Take a screenshot to see current state

## Advanced Usage

### Using the Exec API

For advanced operations, execute JavaScript directly:

```bash
curl -X POST "http://localhost:7236/api/doc/DOC_ID/exec" \
  -H 'Content-Type: application/json' \
  -d '{"code": "return editor.getCurrentPageShapes().length"}'
```

### Batch Operations

Create multiple shapes in one request for better performance:

```json
{
  "actions": [
    {"_type": "create", "shape": {...}},
    {"_type": "create", "shape": {...}},
    {"_type": "update", "shape": {...}}
  ]
}
```

### Custom Layouts

Use mathematical calculations for precise layouts:

```bash
# Create a grid of shapes
for i in {0..4}; do
  for j in {0..4}; do
    x=$((100 + i * 150))
    y=$((100 + j * 150))
    # Create shape at (x, y)
  done
done
```

## Contributing

Found a bug or have a feature request? Please open an issue in the awesome-agent-skills repository.

## License

This plugin is part of the awesome-agent-skills project.

## Author

Created by likai (@libukai)

## Links

- [tldraw Desktop](https://github.com/tldraw/tldraw-desktop)
- [tldraw SDK Documentation](https://tldraw.dev)
- [awesome-agent-skills](https://github.com/libukai/awesome-agent-skills)

---

**Happy Diagramming! 🎨**
