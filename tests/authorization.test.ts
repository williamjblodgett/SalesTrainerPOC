import { describe,expect,it } from "vitest";
type Role='owner'|'manager'|'rep'; const can=(role:Role,action:'manage'|'review'|'practice',owner:boolean)=>owner&&(action==='practice'||role!=='rep');
describe('tenant authorization',()=>{it('denies cross-organization access',()=>expect(can('owner','manage',false)).toBe(false));it('restricts reps',()=>{expect(can('rep','review',true)).toBe(false);expect(can('rep','practice',true)).toBe(true)});it('allows managers to review their tenant',()=>expect(can('manager','review',true)).toBe(true))});
