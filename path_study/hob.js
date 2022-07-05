/**
 * @param {object} gearParam
 * @param {object} hobParam
 * @param {object} installParam
 * @return {number[][]}
 */
function getCoordinates(gearParam, hobParam, installParam) {
  const coordinates = [installParam.hobPoint];
  getGearParam(gearParam);
  getHobParam(hobParam);
  const X2 = hobParam.r + gearParam.ra - gearParam.h;
  const Z2 = installParam.height + gearParam.b - Math.sqrt(hobParam.r ** 2 - (gearParam.h - hobParam.r) ** 2) / Math.cos(hobParam.beta * Math.PI / 180) ** 2;
  const Z3 = installParam.height - Math.sqrt(hobParam.r ** 2 - (gearParam.h - hobParam.r) ** 2) / Math.cos(hobParam.beta * Math.PI / 180) ** 2;
  coordinates.push([X2 + installParam.safeDistance[0], Z2]);
  coordinates.push([X2, Z2]);
  coordinates.push([X2, Z3]);
  coordinates.push([X2 + installParam.safeDistance[1], Z3]);
  coordinates.push(installParam.hobPoint);
  return coordinates;

  function getGearParam(gearParam) {
    gearParam.d = gearParam.m * gearParam.z;
    gearParam.df = gearParam.m * (gearParam.z - 2 * gearParam["ha*"] - 2 * gearParam["c*"]);
    gearParam.db = gearParam.m * gearParam.z * Math.cos(gearParam.alpha * Math.PI / 180)
    gearParam.ra = gearParam.da / 2;
    gearParam.ha = gearParam["ha*"] * gearParam.m;
    gearParam.c = gearParam["c*"] * gearParam.m;
    gearParam.hf = gearParam.m * (gearParam["ha*"] + gearParam["c*"]);
    gearParam.h = gearParam.m * (2 * gearParam["ha*"] + gearParam["c*"]);
    gearParam.s = Math.PI * gearParam.m / 2;
    gearParam.e = Math.PI * gearParam.m / 2;
    gearParam.p = Math.PI * gearParam.m;
  }

  function getHobParam(hobParam) {
    hobParam.r = hobParam.d / 2;
  }
}

const gearParam = {
  z: 30,
  m: 2.5,
  alpha: 20,
  "ha*": 1,
  "c*": 0.25,
  b: 50,
  da: 80
};

const hobParam = {
  z0: 1,
  m: 2.5,
  alpha: 20,
  d: 15,
  beta: 15
}

const installParam = {
  height: 200,
  hobPoint: [80, 400],
  safeDistance: [15, 20]
}

console.log(getCoordinates(gearParam, hobParam, installParam));