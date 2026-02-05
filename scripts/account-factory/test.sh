#!/bin/bash

# Nextdoor Stealth Bot - Quick Test Runner
# This script runs the account creation bot with your current proxy

echo "🚀 Nextdoor Stealth Bot - Test Runner"
echo "======================================"
echo ""
echo "⚙️  Configuration:"
echo "   Proxy: 192.53.67.129:5678 (Sacramento residential)"
echo "   Location: 4554 Nautilus Drive, Miami Beach, FL"
echo "   Email: Auto-generated (test + timestamp)"
echo ""
echo "📋 What will happen:"
echo "   1. Browser will launch (visible, not headless)"
echo "   2. Pre-browsing for 2 minutes on homepage"
echo "   3. Human-like signup with GPS spoofing"
echo "   4. Browser stays open for inspection"
echo ""
echo "🔍 Watch for these console messages:"
echo "   ✅ Stealth mode activated"
echo "   ✅ GPS spoofing injected"
echo "   👻 [GPS Spoof] Injection complete"
echo "   👻 [GPS Spoof] Rewrote address data"
echo "   ✅ Address selected: 4554 Nautilus Drive"
echo ""
read -p "Press ENTER to start the test..."

cd "$(dirname "$0")"
node nextdoor-stealth.js
