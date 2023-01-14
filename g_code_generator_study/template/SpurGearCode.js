import Lib from "../Lib.js";

export default class SpurGearCode {
  constructor(gearParams) {
    this.gearParams = gearParams;
  }

  getCode() {
    const [z, m, beta] = Lib.getGearParams(this.gearParams, ["toothNumber", "modulus", "helixAngle"]);
    let i = 1;
    return `
ZC.MPF
N${i++}0 R11= R12=${z} R13=${m} R14=${beta}
N${i++}0 SPF1
N${i++}0 M10
N${i++}0 M20
N${i++}0 G04 F1
N${i++}0 SPOSA=0
N${i++}0 G01 C100 F3600
N${i++}0 ESRONN
N${i++}0 G01 G90 Z24.5 F500
N${i++}0 X-30
N${i++}0 SPF2
N${i++}0 M03 S1000
N${i++}0 M08
N${i++}0 G01 G90 X-45.12 F500
N${i++}0 G01 G90 Z0 F40
N${i++}0 G01 G90 X-30 F500
N${i++}0 Z24.5
N${i++}0 ESROFF
N${i++}0 M05
N${i++}0 M09
N${i++}0 SPF1
N${i++}0 SPOSA=0
N${i++}0 G01 C100 F3600
N${i++}0 M21
N${i++}0 M11
N${i++}0 M30
`.trim();
  }
}
