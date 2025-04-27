#!/bin/bash
sed -i '' 's|echo "$IP" > "$DEST/ip.txt"|echo "$IP" > "/tmp/ip.txt"|' node_modules/react-native/scripts/react-native-xcode.sh
echo "Patched react-native-xcode.sh to fix ip.txt write error!"
