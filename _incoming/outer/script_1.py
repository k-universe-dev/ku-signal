
import zipfile

# Verify key files in the zip
zip_path = 'output/k2-agent-harness-assets.zip'

with zipfile.ZipFile(zip_path, 'r') as zf:
    # Check events.ts for SessionStateSnapshotSchema (not z.any())
    events_ts = zf.read('src/protocol/events.ts').decode('utf-8')
    print("=== events.ts ===")
    print("Has SessionStateSnapshotSchema:", "SessionStateSnapshotSchema" in events_ts)
    print("Has z.any() for state:", "state: z.any()" in events_ts)
    print()
    
    # Check commands.ts for protocolVersion
    commands_ts = zf.read('src/protocol/commands.ts').decode('utf-8')
    print("=== commands.ts ===")
    protocol_count = commands_ts.count('protocolVersion: z.literal("1.0")')
    print(f"protocolVersion: z.literal(\"1.0\") count: {protocol_count}")
    print()
    
    # Check agent.ts for all 5 methods
    agent_ts = zf.read('src/core/agent.ts').decode('utf-8')
    print("=== agent.ts ===")
    methods = ['createSession', 'destroySession', 'executeCommand', 'invokeTool', 'cancelJob']
    for m in methods:
        print(f"Has {m}: {m in agent_ts}")
    print()
    
    # Check models.ts for no provider imports
    models_ts = zf.read('src/core/models.ts').decode('utf-8')
    print("=== models.ts ===")
    banned = ['from "openai"', 'from "@anthropic-ai/sdk"', 'from "@google/genai"']
    for b in banned:
        print(f"Has {b}: {b in models_ts}")
    print()
    
    # Check verify.ts exists and has checks
    verify_ts = zf.read('scripts/verify.ts').decode('utf-8')
    print("=== verify.ts ===")
    print("Has K2-1 check:", "K2-1" in verify_ts)
    print("Has K2-2 check:", "K2-2" in verify_ts)
    print("Has K2-3 check:", "K2-3" in verify_ts)
    print("Has ARCH check:", "ARCH" in verify_ts)
