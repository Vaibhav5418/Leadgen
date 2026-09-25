import re

def process_file(filepath, activity_type):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'useReportData' in content:
        print(f"Already refactored {filepath}")
        return

    # Insert import
    content = content.replace("import React,", "import React,\nimport useReportData from '../hooks/useReportData';\n", 1)
    if 'useReportData' not in content:
        content = content.replace("import React", "import React\nimport useReportData from '../hooks/useReportData';", 1)

    # Find the start of the state definitions
    state_start_str = "const [project, setProject] = useState(null);"
    state_start_idx = content.find(state_start_str)
    
    if state_start_idx == -1:
        print(f"Could not find start index in {filepath}")
        return

    # Find the end of getMonths or getYears
    match = re.search(r'const (getYears|getMonths) = \(\) => \{.*?\};\s*', content[state_start_idx:], re.DOTALL)
    
    if not match:
        print(f"Could not find getYears or getMonths in {filepath}")
        return
        
    get_years_end_idx = state_start_idx + match.end()

    # Replacement code
    replacement = f"""const {{
    project,
    activities,
    contacts,
    loading,
    lastUpdated,
    viewMode,
    setViewMode,
    getDayKey,
    getMonthKey,
    getYearKey,
    getDays,
    getMonths,
    getYears,
    fetchData
  }} = useReportData(id, '{activity_type}');
"""

    new_content = content[:state_start_idx] + replacement + content[get_years_end_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Refactored {filepath}")


process_file('leadgen-frontend/src/pages/ColdCallingReport.jsx', 'call')
process_file('leadgen-frontend/src/pages/MonthlyReport.jsx', 'all')
