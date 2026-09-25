import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    if 'import KPIButton' not in content:
        content = content.replace("import KPICard from '../components/dashboards/KPICard';", "import KPICard from '../components/dashboards/KPICard';\nimport KPIButton from '../components/dashboards/KPIButton';", 1)
        if 'import KPIButton' not in content:
            content = content.replace("import React", "import KPIButton from '../components/dashboards/KPIButton';\nimport React", 1)

    pattern = re.compile(
        r'<button\s+'
        r'onClick=\{()=>\s*(openKpiProspectModal\(\{.*?\})\s*\}\s+'
        r'className={`bg-gradient-to-br\s+(from-[^\s]+\s+to-[^\s]+)\s+rounded-lg\s+border\s+shadow-sm\s+p-2\.5\s+transition-all\s+hover:shadow-md\s+cursor-pointer\s+\$\{\s*'
        r'([^?]+)\s*\?\s*'
        r'\'(border-[^\s]+)\s+ring-2\s+(ring-[^\s]+)\'\s*:\s*'
        r'\'(border-[^\s]+)\'\s*'
        r'\}`\}\s*>\s*'
        r'<div\s+className="flex\s+items-center\s+justify-between\s+mb-1\.5">\s*'
        r'<div\s+className="w-7\s+h-7\s+rounded-lg\s+bg-white/80\s+border\s+border-[^\s]+\s+flex\s+items-center\s+justify-center">\s*'
        r'(<svg\s+className="w-4\s+h-4\s+(text-[^\s]+)"[^>]*>.*?</svg>)\s*'
        r'</div>\s*'
        r'<span\s+className="text-xs\s+font-semibold\s+(text-[^\s]+)\s+bg-white/70\s+border\s+border-[^\s]+\s+px-2\s+py-1\s+rounded-full">\s*'
        r'([^<]+)\s*'
        r'</span>\s*'
        r'</div>\s*'
        r'<div\s+className="text-2xl\s+font-bold\s+text-gray-900">([^<]+)</div>\s*'
        r'<div\s+className="text-xs\s+text-gray-600\s+mt-1">([^<]+)</div>\s*'
        r'</button>',
        re.DOTALL
    )

    def replacer(match):
        onclick = match.group(1).strip()
        gradientClass = match.group(2).strip()
        condition = match.group(3).strip()
        activeBorder = match.group(4).strip()
        activeRing = match.group(5).strip()
        inactiveBorder = match.group(6).strip()
        svg = match.group(7).strip()
        iconColor = match.group(8).strip()
        badgeColor = match.group(9).strip()
        badgeText = match.group(10).strip()
        value = match.group(11).strip()
        subtext = match.group(12).strip()
        
        # Replace the `()=>` that we removed from match group 1 just inside the replacement
        # wait, match 1 doesn't have `() =>` it is inside the regex outside the capture group
        # The capture group 1 is the function call `openKpiProspectModal({...})`
        
        val_expr = f'{{{value.strip("{}")}}}' if not value.isnumeric() else f'"{value}"'
        
        return (f'<KPIButton\n'
                f'  onClick={{() => {onclick}}}\n'
                f'  isActive={{{condition}}}\n'
                f'  gradientClass="{gradientClass}"\n'
                f'  activeBorderClass="{activeBorder}"\n'
                f'  activeRingClass="{activeRing}"\n'
                f'  inactiveBorderClass="{inactiveBorder}"\n'
                f'  iconColorClass="{iconColor}"\n'
                f'  badgeColorClass="{badgeColor}"\n'
                f'  badgeText="{badgeText}"\n'
                f'  value={val_expr}\n'
                f'  subtext="{subtext}"\n'
                f'  iconSvg={{{svg}}}\n'
                f'/>')

    new_content, count = pattern.subn(replacer, content)
    if count > 0:
        print(f"Replaced {count} KPI buttons.")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
    else:
        print("No matches found.")

if __name__ == '__main__':
    process_file('leadgen-frontend/src/pages/ProjectDetail.jsx')
