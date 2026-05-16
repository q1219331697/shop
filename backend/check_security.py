import json

with open(r"c:/Users/lzz/code/shop/api-docs.json", encoding="utf-8") as f:
    data = json.load(f)

# Check security schemes
if "components" in data and "securitySchemes" in data["components"]:
    print("=== Security Schemes ===")
    print(json.dumps(data["components"]["securitySchemes"], indent=2, ensure_ascii=False))
else:
    print("No securitySchemes found")

if "security" in data:
    print("=== Global Security ===")
    print(json.dumps(data["security"], indent=2, ensure_ascii=False))

if "paths" in data:
    first_path = list(data["paths"].keys())[0]
    first_method = list(data["paths"][first_path].keys())[0]
    path_data = data["paths"][first_path][first_method]
    method_upper = first_method.upper()
    print("=== Sample Path: " + method_upper + " " + first_path + " ===")
    if "security" in path_data:
        print("Security:", json.dumps(path_data["security"], indent=2, ensure_ascii=False))
    else:
        print("No per-path security (using global)")
