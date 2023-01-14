export default class Lib {
  static getGearParam(params, prop) {
    return params["gear" + prop[0].toUpperCase() + prop.slice(1)];
  }

  static getGearParams(params, props) {
    return props.map(prop => Lib.getGearParam(params, prop));
  }

  static floatCalculation(res) {
    return parseFloat(res.toFixed(10));
  }

  static radToDeg(rad) {
    return rad / Math.PI * 180;
  }

  static degToRad(deg) {
    return deg / 180 * Math.PI;
  }
}
