import os

views_dir = 'c:/Users/lzz/code/shop/ui-autotest/frontend/src/views'

renames = {
    'dashboard.vue': 'Dashboard.vue',
    'caselist.vue': 'CaseList.vue',
    'caseedit.vue': 'CaseEdit.vue',
    'flowlist.vue': 'FlowList.vue',
    'flowedit.vue': 'FlowEdit.vue',
    'executionlist.vue': 'ExecutionList.vue',
    'aigenerate.vue': 'AIGenerate.vue',
}

for old, new in renames.items():
    old_path = os.path.join(views_dir, old)
    new_path = os.path.join(views_dir, new)
    if os.path.exists(old_path):
        temp_path = os.path.join(views_dir, old + '.tmp')
        os.rename(old_path, temp_path)
        os.rename(temp_path, new_path)
        print(f'{old} -> {new}')
    else:
        print(f'{old} not found')

print()
for f in os.listdir(views_dir):
    print(f'  {f}')
