import type { NumericInputs, CalculationContext, CalculatorHandler } from "../types.js";
import { resolveRules } from "../../../rules-uk/src/index.js";
import {
  engineeringFrom, ohmsLaw, voltageDrop, electricityCost,
  resistorColourCode, resistorNetwork, density, molarity, molecularWeight,
  heatIndex, windChill, dewPoint, btuRequirement,
  type Conductor, type SupplySystem, type CircuitUse
} from "./wave2.js";

function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

/** Blank means "not supplied", which is different from zero. */
function opt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown, fallback: string): string {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : fallback;
}

/** SCI-001 Ohm's Law */
export const sci001Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = ohmsLaw(
    opt(inputs.voltage), opt(inputs.current), opt(inputs.resistance), opt(inputs.power)
  );
  return {
    outputs: {
      voltage: r.voltage,
      current: r.current,
      resistance: r.resistance,
      power: r.power,
      basis:
        "Ohm's law relates voltage, current and resistance, and the power relations follow from it, so ANY TWO of the four determine the other two. Enter the two you know and leave the rest blank. If you enter more than two they are checked against each other and a contradiction is reported rather than quietly resolved, because a mistyped figure should be caught rather than absorbed. These relations hold for a resistive load at a steady direct current; with alternating current and a reactive load, power is voltage times current times the power factor, and the simple product overstates it."
    }
  };
};

/** SCI-002 Voltage Drop */
export const sci002Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const eng = engineeringFrom(rulesFor(context));
  const conductor = (str(inputs.conductor, "copper") === "aluminium" ? "aluminium" : "copper") as Conductor;
  const sysRaw = str(inputs.system, "single_phase");
  const system = (sysRaw === "dc" || sysRaw === "three_phase" ? sysRaw : "single_phase") as SupplySystem;
  const use = (str(inputs.circuit_use, "other") === "lighting" ? "lighting" : "other") as CircuitUse;

  const r = voltageDrop(
    Number(inputs.current ?? 0),
    Number(inputs.length_m ?? 0),
    Number(inputs.csa_mm2 ?? 0),
    conductor, system,
    Number(inputs.operating_temperature ?? 70),
    Number(inputs.nominal_voltage ?? 230),
    use, eng
  );

  const warnings: string[] = [];
  if (!r.within_limit) {
    warnings.push(
      `The drop of ${r.voltage_drop} V is ${r.voltage_drop_pct.toFixed(2)}% of the nominal voltage, above the ${r.permitted_pct}% this circuit type allows. A larger conductor or a shorter run is needed; at this size the run may be no longer than about ${r.maximum_length_within_limit} m.`
    );
  }
  if (r.reactance_note_applies) {
    warnings.push(
      "Above about 25 square millimetres the inductive reactance of the cable becomes a material part of the drop. This resistive calculation will read low, and the tabulated millivolt per amp per metre figures in BS 7671 should be used instead."
    );
  }

  return {
    outputs: {
      voltage_drop: r.voltage_drop,
      voltage_drop_pct: r.voltage_drop_pct,
      permitted_pct: r.permitted_pct,
      permitted_volts: r.permitted_volts,
      within_limit: r.within_limit,
      maximum_length_within_limit: r.maximum_length_within_limit,
      voltage_at_load: r.voltage_at_load,
      conductor_resistance_ohms: r.conductor_resistance_ohms,
      power_lost_watts: r.power_lost_watts,
      basis:
        "THE FACTOR DEPENDS ON THE SYSTEM: 2 for direct current and single-phase alternating current, because the current goes out along one conductor and back along another, and the square root of three for a balanced three-phase circuit measured line to line. Using 2 for three phase overstates the drop by about fifteen per cent and is the commonest error in a hand calculation. " +
        "RESISTIVITY RISES WITH TEMPERATURE. A cable at its 70 degree operating temperature is roughly a fifth more resistive than at 20, so calculating at ambient flatters every design; the operating temperature is therefore an explicit input. " +
        `The limits shown are the ${eng.voltage_drop_limits_bs7671.reference} figures, 3% for lighting and 5% for other circuits. ${eng.voltage_drop_limits_bs7671.caveat} ` +
        "This is a CHECK, not a compliance certificate: a real design must consult the standard itself and also satisfy current-carrying capacity, earth fault loop impedance and disconnection times, none of which this calculator addresses."
    },
    warnings
  };
};

/** SCI-003 Electricity Calculator */
export const sci003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = electricityCost(
    Number(inputs.power_watts ?? 0),
    Number(inputs.hours_per_day ?? 0),
    Number(inputs.days ?? 365),
    Number(inputs.price_pence_per_kwh ?? 0),
    Number(inputs.standing_charge_pence_per_day ?? 0),
    opt(inputs.uses_per_day)
  );
  return {
    outputs: {
      energy_kwh: r.energy_kwh,
      energy_cost: r.energy_cost,
      standing_charge_cost: r.standing_charge_cost,
      total_cost: r.total_cost,
      cost_per_day: r.cost_per_day,
      cost_per_use: r.cost_per_use,
      kwh_per_year: r.kwh_per_year,
      cost_per_year: r.cost_per_year,
      standing_charge_share_pct: r.standing_charge_share_pct,
      basis:
        "THE STANDING CHARGE IS SHOWN SEPARATELY because it is paid whether or not the appliance runs, and a comparison that folds it into the unit rate makes a rarely-used appliance look far more expensive than it is. The share it represents is reported for the same reason. " +
        "The unit rate and standing charge are yours to enter from your own bill rather than assumed, because they differ by supplier, by tariff, by payment method and by region, and a rate hard-coded today would be wrong within months. An appliance's rated power is also its MAXIMUM: a fridge, a washing machine or anything thermostatically controlled draws its rated power only part of the time, so a plug-in energy monitor will read lower than this."
    }
  };
};

/** SCI-004 Resistor Calculator */
export const sci004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const mode = str(inputs.mode, "colour_code");

  if (mode === "network") {
    const raw = String(inputs.resistances ?? "");
    const values = raw
      .split(/[\s,;]+/)
      .filter(t => t.length > 0)
      .map(t => {
        const n = Number(t);
        if (!Number.isFinite(n)) {
          throw new Error(`"${t}" is not a number. Enter resistances in ohms, separated by commas.`);
        }
        return n;
      });
    const r = resistorNetwork(values);
    return {
      outputs: {
        series_ohms: r.series_ohms,
        parallel_ohms: r.parallel_ohms,
        series_formatted: r.series_formatted,
        parallel_formatted: r.parallel_formatted,
        count: r.count,
        basis:
          "IN SERIES RESISTANCES ADD; IN PARALLEL THEIR RECIPROCALS ADD. Two consequences are worth stating because they are useful checks on your own arithmetic: a series total is always LARGER than the largest resistor in the chain, and a parallel total is always SMALLER than the smallest. If your answer breaks either rule, the arrangement has been read the wrong way round."
      }
    };
  }

  const bands = [
    inputs.band1, inputs.band2, inputs.band3, inputs.band4, inputs.band5, inputs.band6
  ].map(b => String(b ?? "").trim()).filter(b => b.length > 0 && b !== "none");

  const r = resistorColourCode(bands);
  return {
    outputs: {
      resistance_ohms: r.resistance_ohms,
      formatted: r.formatted,
      tolerance_pct: r.tolerance_pct,
      minimum_ohms: r.minimum_ohms,
      maximum_ohms: r.maximum_ohms,
      temperature_coefficient_ppm_per_k: r.temperature_coefficient_ppm_per_k,
      basis:
        "READ THE BANDS FROM THE END WHERE THEY ARE CLOSEST TOGETHER. The tolerance band sits slightly apart from the rest, and a resistor read backwards gives a completely different and entirely plausible value, which is why the mistake is so easy to miss. " +
        "The tolerance is not decoration: a 4.7k resistor at plus or minus 5 per cent is anywhere from 4,465 to 4,935 ohms, and both ends are shown here. A resistor with no tolerance band at all is plus or minus twenty per cent."
    }
  };
};

/** SCI-005 Density Calculator */
export const sci005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = density(
    opt(inputs.mass), str(inputs.mass_unit, "kg"),
    opt(inputs.volume), str(inputs.volume_unit, "m3"),
    opt(inputs.density)
  );
  return {
    outputs: {
      density_kg_per_m3: r.density_kg_per_m3,
      density_g_per_cm3: r.density_g_per_cm3,
      density_lb_per_ft3: r.density_lb_per_ft3,
      mass_kg: r.mass_kg,
      volume_m3: r.volume_m3,
      relative_to_water: r.relative_to_water,
      floats_in_fresh_water: r.floats_in_fresh_water,
      basis:
        "Density relates mass and volume, so ANY TWO of the three determine the third; enter the two you know and leave the other blank. Supplying all three is treated as a check and a contradiction is reported. " +
        "The figure relative to water is the specific gravity, and it is what decides whether something floats: below 1 it floats in fresh water, above it it sinks. Sea water is denser at about 1.025, so a few materials float in the sea and sink in a lake. Density also changes with temperature, and for gases with pressure, so a single figure describes one set of conditions."
    }
  };
};

/** SCI-006 Molarity Calculator */
export const sci006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = molarity(
    opt(inputs.molarity), opt(inputs.moles), opt(inputs.volume_litres),
    opt(inputs.mass_grams), opt(inputs.molar_mass), opt(inputs.target_molarity)
  );
  return {
    outputs: {
      molarity_mol_per_litre: r.molarity_mol_per_litre,
      moles: r.moles,
      volume_litres: r.volume_litres,
      mass_grams: r.mass_grams,
      dilution_volume_litres: r.dilution_volume_litres,
      dilution_solvent_to_add_litres: r.dilution_solvent_to_add_litres,
      basis:
        "Concentration, moles and volume are related, so any two give the third. A MASS AND A MOLAR MASS MAY STAND IN FOR THE MOLES, because that is how the calculation is actually done at a bench: nobody counts moles, they weigh a solid. " +
        "The dilution figures follow from concentration times volume being conserved. The volume shown is the FINAL volume, and the solvent to add is the difference; making up to a mark is not the same as adding that much solvent, and confusing the two is the usual reason a dilution comes out wrong. Concentrating a solution by dilution is impossible, so a target above the stock is refused rather than answered with a negative volume."
    }
  };
};

/** SCI-007 Molecular Weight Calculator */
export const sci007Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const eng = engineeringFrom(rulesFor(context));
  const r = molecularWeight(String(inputs.formula ?? ""), eng.standard_atomic_weights);
  return {
    outputs: {
      formula: r.formula,
      molar_mass: r.molar_mass,
      distinct_elements: r.distinct_elements,
      total_atoms: r.total_atoms,
      basis:
        "Brackets and hydrates are both understood, so Ca(OH)2 and CuSO4.5H2O parse correctly; a dot or a middle dot separates a hydrate. AN ELEMENT THE CALCULATOR HAS NO STANDARD ATOMIC WEIGHT FOR IS REFUSED BY NAME rather than skipped, because a skipped element silently understates the molar mass and the answer would still look like a number. " +
        "The weights are IUPAC conventional values. They are averages over the isotopic composition found in normal terrestrial material, so a sample enriched or depleted in an isotope, as in heavy water, has a different molar mass from the one shown."
    },
    schedule: r.elements
  };
};

/** SCI-008 Heat Index Calculator */
export const sci008Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const unit = str(inputs.temperature_unit, "c");
  const raw = Number(inputs.temperature ?? 0);
  const tC = unit === "f" ? ((raw - 32) * 5) / 9 : raw;
  const r = heatIndex(tC, Number(inputs.relative_humidity ?? 0));

  const warnings: string[] = [];
  if (r.heat_index_f >= 103) {
    warnings.push(
      "This is in the danger range. Heat exhaustion is likely with continued exposure or activity, and heat stroke is possible. Get into shade or cool air, drink water, and treat any confusion, stopped sweating or collapse as a medical emergency."
    );
  }

  return {
    outputs: {
      heat_index_c: r.heat_index_c,
      heat_index_f: r.heat_index_f,
      temperature_c: r.temperature_c,
      relative_humidity: r.relative_humidity,
      feels_hotter_by_c: r.feels_hotter_by_c,
      category: r.category,
      basis:
        "This is the US National Weather Service heat index, implemented as the NWS publishes it including the step most reimplementations omit: a SIMPLE FORMULA IS TRIED FIRST and the full regression is used only where that indicates about 80 Fahrenheit or above. Applying the regression unconditionally gives badly wrong answers in mild conditions, which is most of the British year. " +
        "The index assumes SHADE AND A LIGHT WIND. In full sun it can understate the effective temperature by as much as 15 Fahrenheit, so a reading that looks merely uncomfortable can be dangerous on an exposed site. It is a guide to risk, not a medical assessment, and individual tolerance varies widely with age, medication, acclimatisation and fitness."
    },
    warnings
  };
};

/** SCI-009 Wind Chill Calculator */
export const sci009Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const speedUnit = str(inputs.wind_speed_unit, "kmh");
  const rawSpeed = Number(inputs.wind_speed ?? 0);
  const kmh = speedUnit === "mph" ? rawSpeed * 1.609344 : rawSpeed;
  const tempUnit = str(inputs.temperature_unit, "c");
  const rawT = Number(inputs.temperature ?? 0);
  const tC = tempUnit === "f" ? ((rawT - 32) * 5) / 9 : rawT;

  const r = windChill(tC, kmh);
  const warnings: string[] = [];
  if (r.wind_chill_c <= -28) {
    warnings.push(
      "Exposed skin can freeze within half an hour at this wind chill, and much faster as it falls further. Cover every exposed area and limit time outside."
    );
  }
  return {
    outputs: {
      wind_chill_c: r.wind_chill_c,
      wind_chill_f: r.wind_chill_f,
      temperature_c: r.temperature_c,
      wind_speed_kmh: r.wind_speed_kmh,
      wind_speed_mph: r.wind_speed_mph,
      feels_colder_by_c: r.feels_colder_by_c,
      frostbite_risk: r.frostbite_risk,
      basis:
        "This is the 2001 JAG/TI index used by the Met Office and the North American weather services. It is an EMPIRICAL FIT VALID ONLY at or below 10 degrees Celsius and above 4.8 km/h, and outside that range it is refused rather than extrapolated: in still air the formula reads warmer than the actual temperature, which is meaningless. " +
        "Wind chill describes HOW FAST EXPOSED SKIN LOSES HEAT, not how cold anything actually gets. A pipe, a car or a puddle will not freeze at a wind chill of minus five if the air is at plus two; only the rate of cooling changes, never the temperature things settle at. The index also assumes bare skin and no sun, so clothing and sunshine both make the felt cold less severe than the number suggests."
    },
    warnings
  };
};

/** SCI-010 Dew Point Calculator */
export const sci010Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const unit = str(inputs.temperature_unit, "c");
  const conv = (v: number) => (unit === "f" ? ((v - 32) * 5) / 9 : v);
  const dpIn = opt(inputs.dew_point);
  const r = dewPoint(
    conv(Number(inputs.temperature ?? 0)),
    opt(inputs.relative_humidity),
    dpIn === null ? null : conv(dpIn)
  );
  return {
    outputs: {
      dew_point_c: r.dew_point_c,
      dew_point_f: r.dew_point_f,
      relative_humidity: r.relative_humidity,
      temperature_c: r.temperature_c,
      saturation_vapour_pressure_hpa: r.saturation_vapour_pressure_hpa,
      actual_vapour_pressure_hpa: r.actual_vapour_pressure_hpa,
      absolute_humidity_g_per_m3: r.absolute_humidity_g_per_m3,
      is_frost_point: r.is_frost_point,
      comfort: r.comfort,
      basis:
        "THE DEW POINT, NOT THE RELATIVE HUMIDITY, IS WHAT YOU FEEL. Relative humidity is relative to temperature, so 70 per cent on a cold morning and 70 per cent on a warm afternoon describe completely different amounts of water in the air; the dew point is an absolute measure and is directly comparable between days. " +
        "It is also what decides condensation: any surface colder than the dew point will get wet, which is why cold-bridged walls and single-glazed windows stream while the room feels dry. BELOW ZERO IT IS PROPERLY A FROST POINT, and water vapour deposits as frost rather than condensing as dew; this is flagged when it applies. The relation used is the Arden Buck equation, which fits observations better across this range than the older Magnus-Tetens coefficients."
    }
  };
};

/** SCI-011 BTU Calculator */
export const sci011Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const eng = engineeringFrom(rulesFor(context));
  const r = btuRequirement(
    Number(inputs.length_m ?? 0),
    Number(inputs.width_m ?? 0),
    Number(inputs.height_m ?? 2.4),
    Number(inputs.watts_per_m3 ?? 40),
    opt(inputs.price_pence_per_kwh),
    eng
  );
  return {
    outputs: {
      room_volume_m3: r.room_volume_m3,
      heat_requirement_watts: r.heat_requirement_watts,
      heat_requirement_kw: r.heat_requirement_kw,
      heat_requirement_btu_per_hour: r.heat_requirement_btu_per_hour,
      therms_per_hour: r.therms_per_hour,
      running_cost_pence_per_hour: r.running_cost_pence_per_hour,
      watts_per_cubic_metre_used: r.watts_per_cubic_metre_used,
      basis:
        "THE WATTS PER CUBIC METRE FACTOR IS YOURS TO SET AND THIS CALCULATOR DOES NOT INVENT ONE. A room's heat loss depends on its insulation, its glazing, how many walls face outside and how draughty it is, and the published rules of thumb differ by a factor of two between a modern insulated room and a solid-walled Victorian one with a bay window. Publishing a single factor as though it were authoritative would be a guess wearing the costume of a calculation. A proper heat loss calculation follows a method such as BS EN 12831 and works room by room from fabric U-values and air change rates. " +
        "BTU per hour is a rate of heat output, not a quantity of energy, which is why radiators are sold in it and gas is billed in therms. The BTU used is the International Table definition, the one behind UK gas billing; a therm is exactly a hundred thousand of them."
    }
  };
};
