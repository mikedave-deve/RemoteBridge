// Year-end tax forms HR can issue from the admin portal, with the boxes printed on each.
export const FORM_BOXES = {
  'W-2': [
    ['1', 'Wages, tips, other compensation'], ['2', 'Federal income tax withheld'], ['3', 'Social Security wages'], ['4', 'Social Security tax withheld'],
    ['5', 'Medicare wages and tips'], ['6', 'Medicare tax withheld'], ['7', 'Social Security tips'], ['8', 'Allocated tips'],
    ['10', 'Dependent care benefits'], ['11', 'Nonqualified plans'], ['12a', 'Box 12a (code and amount)'], ['12b', 'Box 12b (code and amount)'],
    ['12c', 'Box 12c (code and amount)'], ['12d', 'Box 12d (code and amount)'], ['13', 'Statutory employee, retirement plan, sick pay'], ['14', 'Other'],
    ['15', 'State · Employer state ID number'], ['16', 'State wages, tips, etc.'], ['17', 'State income tax'], ['18', 'Local wages, tips, etc.'],
    ['19', 'Local income tax'], ['20', 'Locality name'],
  ],
  '1099-NEC': [
    ['1', 'Nonemployee compensation'], ['2', 'Direct sales of $5,000 or more'], ['4', 'Federal income tax withheld'],
    ['5', 'State tax withheld'], ['6', 'State · Payer’s state number'], ['7', 'State income'],
  ],
}
export const FORM_NAMES = { 'W-2': 'Wage and Tax Statement', '1099-NEC': 'Nonemployee Compensation' }
const MONEY = { 'W-2': ['1', '2', '3', '4', '5', '6', '7', '8', '10', '11', '16', '17', '18', '19'], '1099-NEC': ['1', '4', '5', '7'] }
export const isMoneyBox = (type, b) => !!MONEY[type]?.includes(b)
