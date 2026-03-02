---
description: List all shapes on the current tldraw canvas
---

# List Canvas Shapes

Display all shapes currently on the tldraw canvas with their properties.

## Usage

```
/tldraw:list
```

## What this command does

1. Gets the current document ID
2. Fetches all shapes from the canvas
3. Displays a formatted list with:
   - Shape ID
   - Shape type
   - Position (x, y)
   - Size (w, h) if applicable
   - Color
   - Text content (if any)

---

## Implementation

```bash
# Get document ID
DOC_ID=$(curl -s http://localhost:7236/api/doc | jq -r '.docs[0].id')

# Get all shapes
curl -s "http://localhost:7236/api/doc/$DOC_ID/shapes" | jq .
```

Format the output in a readable table or list format for the user.

Example output:
```
Canvas Shapes (10 total):

1. box1 (rectangle)
   - Position: (100, 100)
   - Size: 300 x 200
   - Color: blue
   - Text: "Hello tldraw"

2. circle1 (ellipse)
   - Position: (500, 100)
   - Size: 200 x 200
   - Color: red
   - Text: "Circle"

...
```
