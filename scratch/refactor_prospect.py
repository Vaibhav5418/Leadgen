import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make sure import is there
    if 'import KPICard' not in content:
        content = content.replace('export default function', "import KPICard from '../components/dashboards/KPICard';\n\nexport default function", 1)

    # We need to find this pattern:
    # <div className="bg-gradient-to-br from-... shadow-sm p-6">
    #   <div className="flex items-center justify-between mb-3">
    #     <div className="w-12 h-12 rounded-lg bg-white/80 border ... shadow-xs">
    #       <svg ...>...</svg>
    #     </div>
    #     <span className="text-xs font-semibold ...">BADGE</span>
    #   </div>
    #   <div className="text-3xl font-bold ...">{VALUE}</div>
    #   <div className="text-sm text-gray-600 mt-1">SUBTEXT</div>
    # </div>
    
    # We will use a regex that captures all the parts
    pattern = re.compile(
        r'<div\s+className="bg-gradient-to-br\s+(from-[^\s]+\s+to-[^\s]+)\s+rounded-xl\s+border\s+(border-[^\s]+)\s+shadow-sm\s+p-6">\s*'
        r'<div\s+className="flex\s+items-center\s+justify-between\s+mb-3">\s*'
        r'<div\s+className="w-12\s+h-12\s+rounded-lg\s+bg-white/80\s+border\s+(?:border-[^\s]+)\s+flex\s+items-center\s+justify-center\s+shadow-xs">\s*'
        r'(<svg\s+className="w-6\s+h-6\s+(text-[^\s]+)"[^>]*>.*?</svg>)\s*'
        r'</div>\s*'
        r'<span\s+className="text-xs\s+font-semibold\s+(text-[^\s]+)\s+bg-white/70\s+border\s+(?:border-[^\s]+)\s+px-2\s+py-1\s+rounded-full\s+shadow-xs">\s*'
        r'([^<]+)\s*'
        r'</span>\s*'
        r'</div>\s*'
        r'<div\s+className="text-3xl\s+font-bold\s+text-gray-900\s+leading-tight">([^<]+)</div>\s*'
        r'<div\s+className="text-sm\s+text-gray-600\s+mt-1">([^<]+)</div>\s*'
        r'</div>',
        re.DOTALL
    )

    def replacer(match):
        gradientClass = match.group(1).strip()
        borderColorClass = match.group(2).strip()
        svg = match.group(3).strip()
        iconColorClass = match.group(4).strip()
        badgeColorClass = match.group(5).strip()
        badgeText = match.group(6).strip()
        value = match.group(7).strip()
        subtext = match.group(8).strip()
        
        return (f'<KPICard\n'
                f'  gradientClass="{gradientClass}"\n'
                f'  borderColorClass="{borderColorClass}"\n'
                f'  iconColorClass="{iconColorClass}"\n'
                f'  badgeColorClass="{badgeColorClass}"\n'
                f'  badgeText="{badgeText}"\n'
                f'  value={{{value.strip("{}")}}}\n'
                f'  subtext="{subtext}"\n'
                f'  iconSvg={{{svg}}}\n'
                f'/>')

    new_content, count = pattern.subn(replacer, content)
    print(f"Replaced {count} KPI cards.")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    process_file('leadgen-frontend/src/pages/ProspectDashboard.jsx')
