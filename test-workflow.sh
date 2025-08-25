#!/bin/bash

echo "🧪 Testing GitHub Actions workflow..."
echo "================================="

# Check if act is available
if ! command -v act &> /dev/null; then
    echo "❌ act not found. Installing via Homebrew..."
    brew install act
    echo "✅ act installed successfully"
fi

echo ""
echo "1️⃣ Testing YAML syntax and structure..."
act --list --container-architecture linux/amd64

if [ $? -eq 0 ]; then
    echo "✅ YAML syntax is valid!"
else
    echo "❌ YAML syntax error detected!"
    exit 1
fi

echo ""
echo "2️⃣ Running dry-run test of workflow..."
act workflow_dispatch --job update-data --container-architecture linux/amd64 -n

if [ $? -eq 0 ]; then
    echo "✅ Workflow dry-run completed successfully!"
else
    echo "❌ Workflow dry-run failed!"
    exit 1
fi

echo ""
echo "🎉 All tests passed! You can safely push this workflow."
echo ""
echo "💡 To run the workflow locally (actual execution):"
echo "   act workflow_dispatch --job update-data --container-architecture linux/amd64"
echo ""
echo "💡 To test with different events:"
echo "   act push --job update-data --container-architecture linux/amd64 -n"
echo "   act schedule --job update-data --container-architecture linux/amd64 -n"
