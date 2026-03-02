---
description: Clear all shapes from the tldraw canvas
---

# Clear Canvas

Remove all shapes from the current tldraw canvas.

## Usage

```
/tldraw:clear
```

## What this command does

1. Gets all shapes from the current canvas
2. Asks for confirmation before deleting
3. Deletes all shapes in a single batch operation
4. Confirms the canvas has been cleared

---

## Implementation

```bash
# Get document ID
DOC_ID=$(curl -s http://localhost:7236/api/doc | jq -r '.docs[0].id')

# Get all shape IDs
SHAPE_IDS=$(curl -s "http://localhost:7236/api/doc/$DOC_ID/shapes" | \
  jq -r '.shapes[].shapeId')

# Count shapes
COUNT=$(echo "$SHAPE_IDS" | wc -l | tr -d ' ')
```

Use AskUserQuestion to confirm:
- "Found $COUNT shapes. Delete all shapes from the canvas?"
- Options: "Yes, clear canvas" / "No, keep shapes"

If confirmed, create delete actions for all shapes:

```bash
# Build delete actions JSON
ACTIONS=$(echo "$SHAPE_IDS" | jq -R -s 'split("\n") | map(select(length > 0)) | map({_type: "delete", shapeId: .})')

# Send delete request
curl -X POST "http://localhost:7236/api/doc/$DOC_ID/actions" \
  -H 'Content-Type: application/json' \
  -d "{\"actions\": $ACTIONS}"
```

Confirm to the user: "Canvas cleared. Deleted $COUNT shapes."
