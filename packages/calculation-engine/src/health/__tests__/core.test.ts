import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { calculateBMI } from '../core.js';

describe('Health Calculations - BMI', () => {
    it('should calculate BMI correctly for healthy weight', () => {
        const result = calculateBMI(70, 1.75);
        assert.strictEqual(result.bmi, 22.86);
        assert.strictEqual(result.category, 'Healthy weight');
    });

    it('should calculate BMI correctly for underweight', () => {
        const result = calculateBMI(50, 1.75);
        assert.strictEqual(result.bmi, 16.33);
        assert.strictEqual(result.category, 'Underweight');
    });

    it('should calculate BMI correctly for overweight', () => {
        const result = calculateBMI(85, 1.75);
        assert.strictEqual(result.bmi, 27.76);
        assert.strictEqual(result.category, 'Overweight');
    });

    it('should calculate BMI correctly for obesity', () => {
        const result = calculateBMI(100, 1.75);
        assert.strictEqual(result.bmi, 32.65);
        assert.strictEqual(result.category, 'Obesity');
    });

    it('should calculate BMI correctly for severe obesity', () => {
        const result = calculateBMI(125, 1.7);
        assert.strictEqual(result.bmi, 43.25);
        assert.strictEqual(result.category, 'Severe obesity');
    });

    it('should handle edge cases and invalid inputs appropriately', () => {
        assert.throws(() => calculateBMI(0, 1.75));
        assert.throws(() => calculateBMI(70, 0));
        assert.throws(() => calculateBMI(-70, 1.75));
        assert.throws(() => calculateBMI(70, -1.75));
        assert.throws(() => calculateBMI(NaN, 1.75));
        assert.throws(() => calculateBMI(70, NaN));
        assert.throws(() => calculateBMI(Infinity, 1.75));
        assert.throws(() => calculateBMI(70, Infinity));
        // @ts-ignore
        assert.throws(() => calculateBMI("70", 1.75));
    });
});
