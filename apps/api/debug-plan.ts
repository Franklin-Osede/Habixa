import { PlanItem } from './src/modules/planning/domain/plan-item.entity';

console.log('Script started');
try {
  console.log('Imported PlanItem:', PlanItem);
  if (typeof PlanItem.create === 'function') {
    console.log('PlanItem.create is a function');
  } else {
    console.error('PlanItem.create is NOT a function', PlanItem);
  }
} catch (e) {
  console.error('Error:', e);
}
