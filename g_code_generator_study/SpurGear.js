import Lib from "./Lib.js";
import SpurGearCode from "./template/SpurGearCode.js";

export default class SpurGear {
  constructor(form) {
    this.params = form;
    const code = new SpurGearCode(this.params);
    console.log(code.getCode());
  }

  calculateParams() {
    const [m, z, alpha, ha$, c$] = Lib.getGearParams(this.params, ["modulus", "toothNumber", "pressureAngle", "addendumCoefficient", "clearanceCoefficient"]);
    // 齿顶高、顶隙
    const ha = this.params.gearAddendum = Lib.floatCalculation(ha$ * m);
    const c = this.params.gearClearance = Lib.floatCalculation(c$ * m);
    // 分度圆、齿顶圆、齿根圆、基圆
    const d = this.params.gearPitchDiameter = Lib.floatCalculation(m * z);
    const r = this.params.gearPitchRadius = Lib.floatCalculation(d / 2);
    const da = this.params.gearAddendumDiameter = Lib.floatCalculation(d + 2 * ha);
    const ra = this.params.gearAddendumRadius = Lib.floatCalculation(da / 2);
    const hf = this.params.gearDedendum = Lib.floatCalculation(ha + c);
    const df = this.params.gearDedendumDiameter = Lib.floatCalculation(d - 2 * hf);
    const rf = this.params.gearDedendumRadius = Lib.floatCalculation(df / 2);
    const h = this.params.gearWholeDepth = Lib.floatCalculation(ha + hf);
    const db = this.params.gearBaseCircleDiameter = Lib.floatCalculation(d * Math.cos(Lib.degToRad(alpha)));
    const rb = this.params.gearBaseCircleRadius = Lib.floatCalculation(db / 2);
    // 中心孔
    const dh = Lib.getGearParam(this.params, "centerHoleDiameter");
    const rh = this.params.gearCenterHoleRadius = Lib.floatCalculation(dh / 2);
    // 齿距、齿厚、齿槽宽
    const p = this.params.gearCircularPitch = Lib.floatCalculation(Math.PI * m);
    const s = this.params.gearToothThickness = Lib.floatCalculation(p / 2);
    const e = this.params.gearSpaceWidth = Lib.floatCalculation(p / 2);
    // 其他
    this.params.angleToothToTooth = Lib.floatCalculation(Lib.degToRad(360 / z));
  }
}
