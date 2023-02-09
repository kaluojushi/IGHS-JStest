import Status from "./Status.js";

class Model {
  constructor(form) {
    this.params = this.stringObjToNumberObj(form);
    this.position = {};
    this.ORIGIN = {X: 0, Y: 0};
    this.CLIPPER_SCALE = 100000;
    this.CLIPPER_LIGHTEN_FACTOR = 0.0005;
  }

  calculateParams() {
    const [m, z, alpha, ha$, c$] = this.getGearParams(["modulus", "toothNumber", "pressureAngle", "addendumCoefficient", "clearanceCoefficient"]);
    // 齿顶高、顶隙
    const ha = this.params.gearAddendum = this.floatCalculation(ha$ * m);
    const c = this.params.gearClearance = this.floatCalculation(c$ * m);
    // 分度圆、齿顶圆、齿根圆、基圆
    const d = this.params.gearPitchDiameter = this.floatCalculation(m * z);
    const r = this.params.gearPitchRadius = this.floatCalculation(d / 2);
    const da = this.params.gearAddendumDiameter = this.floatCalculation(d + 2 * ha);
    const ra = this.params.gearAddendumRadius = this.floatCalculation(da / 2);
    const hf = this.params.gearDedendum = this.floatCalculation(ha + c);
    const df = this.params.gearDedendumDiameter = this.floatCalculation(d - 2 * hf);
    const rf = this.params.gearDedendumRadius = this.floatCalculation(df / 2);
    const h = this.params.gearWholeDepth = this.floatCalculation(ha + hf);
    const db = this.params.gearBaseCircleDiameter = this.floatCalculation(d * Math.cos(this.degToRad(alpha)));
    const rb = this.params.gearBaseCircleRadius = this.floatCalculation(db / 2);
    // 中心孔
    const dh = this.params.gearCenterHoleDiameter;
    const rh = this.params.gearCenterHoleRadius = this.floatCalculation(dh / 2);
    // 齿距、齿厚、齿槽宽
    const p = this.params.gearCircularPitch = this.floatCalculation(Math.PI * m);
    const s = this.params.gearToothThickness = this.floatCalculation(p / 2);
    const e = this.params.gearSpaceWidth = this.floatCalculation(p / 2);
    // 其他
    this.params.angleToothToTooth = this.floatCalculation(this.degToRad(360 / z));

    return this.numberObjToStringObj(this.params);
  }

  checkParams() {
    const [m, z, alpha, ha$, c$, dh] = this.getGearParams(["modulus", "toothNumber", "pressureAngle", "addendumCoefficient", "clearanceCoefficient", "centerHoleDiameter"]);
    const errorMessage = [];

    if (m <= 0) {
      errorMessage.push("模数必须大于0");
    }
    if (z < 3) {
      errorMessage.push("齿数必须不少于3");
    }
    if (alpha <= 0) {
      errorMessage.push("压力角必须大于0");
    }
    const df$ = z - 2 * ha$ - 2 * c$;
    if (df$ <= 0) {
      errorMessage.push("齿顶高/顶隙系数过大");
    }
    if (df$ > 0 && (dh >= Math.min(df$ * m, m * z * Math.cos(this.degToRad(alpha))))) {
      errorMessage.push("中心孔直径过大");
    }

    if (errorMessage.length > 0) {
      return Status.createError(errorMessage.join("；"))
    }
    return Status.OK;
  }

  setCenter(center) {
    this.position.center = this.clonePoint(center);
  }

  generate() {
    const ra = this.getGearParam("addendumRadius");
    this.position.topLeft = this.addVectors(this.position.center, this.createPoint(-ra, ra));
    this.position.bottomRight = this.addVectors(this.position.center, this.createPoint(ra, -ra));
    this.position.width = this.position.bottomRight.X - this.position.topLeft.X;
    this.position.height = this.position.bottomRight.X - this.position.topLeft.X;
    this.position.left = this.position.topLeft.X;
    this.position.top = this.position.topLeft.Y;

    this.toothPointsTemplate = this.createToothPath();
  }

  createGraphics(parent, regularLinesStyle, helperLinesStyle, markerLinesStyle) {
    const gearGroup = parent.group();

    // 获得齿刀路径
    const tempGroup = gearGroup.group();
    tempGroup.stroke(regularLinesStyle).fill("none");
    const cutterPath = this.createToothCutter().cutterPath;
    const path = tempGroup.path();
    // this.drawCircles(tempGroup, cutterPath, 0.1)
    // path.stroke({width: 0.02});
    // path.M(this.createSVGPoint(cutterPath[2]));
    // for (let i = 0; i < 3; i++) {
    //   path.L(this.createSVGPoint(cutterPath[(3 + i) % 4]));
    // }

    // 绘画齿刀包络线
    const cutterPaths = this.createToothCutterPaths().cutterPaths;
    path.stroke({width: 0.02, linecap: "round"});

    // 动画
    // let i = 0;
    // for(let j = 0; j < cutterPaths.length; j += 5) {
    //   const pa = cutterPaths[j];
    //   setTimeout(() => {
    //     path.M(this.createSVGPoint(pa[0]));
    //     pa.slice(1).forEach(p => path.L(this.createSVGPoint(p)));
    //     path.L(this.createSVGPoint(pa[0]));
    //   }, 2000 + 10 * (i++))
    // }

    // 直接画
    for(let j = 0; j < cutterPaths.length; j += 5) {
      const pa = cutterPaths[j];
      path.M(this.createSVGPoint(pa[0]));
      pa.slice(1).forEach(p => path.L(this.createSVGPoint(p)));
      path.L(this.createSVGPoint(pa[0]));
    }

    // 外部遮罩
    const outerGroup = gearGroup.group();
    const outerPath = outerGroup.path();
    outerPath.stroke({width: 0}).fill("white");
    const rectPath = [{X: -2 * this.position.width, Y: -2 * this.position.height}, {X: 2 * this.position.width, Y: -2 * this.position.height}, {X: 2 * this.position.width, Y: 2 * this.position.height}, {X: -2 * this.position.width, Y: 2 * this.position.height}];
    outerPath.M(this.createSVGPoint(rectPath[0]));
    rectPath.slice(1).forEach(p => outerPath.L(this.createSVGPoint(p)));
    const ra = this.getGearParam("addendumRadius");
    outerPath.M(this.createSVGPoint({X: 0, Y: -ra}));
    outerPath.A(ra, ra, 0, 1, 0, this.createSVGPoint({X: 0.001, Y: -Math.sqrt(ra * ra - 0.001 * 0.001)}));
    outerPath.Z();

    // 绘画齿顶圆、齿根圆
    const helperGroup1 = gearGroup.group();
    helperGroup1.stroke(helperLinesStyle).fill("none");
    this.drawCircle(helperGroup1, this.ORIGIN, this.params.gearAddendumRadius);
    this.drawCircle(helperGroup1, this.ORIGIN, this.params.gearDedendumRadius);

    const regularGroup = gearGroup.group();
    regularGroup.stroke(regularLinesStyle).fill("none");

    const helperGroup2 = gearGroup.group();
    helperGroup2.stroke(helperLinesStyle).fill("none");

    // 绘画分度圆、基圆
    this.drawCircle(helperGroup2, this.ORIGIN, this.params.gearPitchRadius);
    this.drawCircle(helperGroup2, this.ORIGIN, this.params.gearBaseCircleRadius);

    // 创建齿廓
    this.createHalfToothPath(regularGroup);
    this.createToothPath(regularGroup);
    // 插入齿轮路径
    this.insertGearSVGPath(regularGroup);

    // 画两条辅助线
    const angle = this.params.angleToothToTooth / 2;
    const tanAngle = Math.tan(angle);
    const yt = 1.25 * this.params.gearAddendumRadius;
    const p1 = this.createPoint(-yt * tanAngle, -yt);
    const p2 = this.createPoint(yt * tanAngle, -yt);
    this.drawLine(helperGroup2, this.ORIGIN, p1);
    this.drawLine(helperGroup2, this.ORIGIN, p2);

    // 齿轮移动到中心点
    gearGroup.move(this.position.center.X, this.position.center.Y);
  }

  // 创建齿刀
  createToothCutter() {
    const [s, ha, hf, alpha, r] = this.getGearParams(["toothThickness", "addendum", "dedendum", "pressureAngle", "pitchRadius"]);
    const cutterDepth = hf;
    const cutterOutsideLength = 3 * ha;
    const cosAlpha = Math.cos(this.degToRad(alpha));
    const tanAlpha = Math.tan(this.degToRad(alpha));

    const dx = 0;
    const yBottom = r - cutterDepth;
    const yTop = r + cutterOutsideLength;

    const bottomRightCorner = this.createPoint(s / 2 + dx - tanAlpha * cutterDepth, -yBottom);
    const topRightCorner = this.createPoint(s / 2 + dx + tanAlpha * cutterOutsideLength, -yTop);
    const topLeftCorner = this.createPoint(-topRightCorner.X, topRightCorner.Y);
    const bottomLeftCorner = this.createPoint(-bottomRightCorner.X, bottomRightCorner.Y);

    const cutterPath = [bottomLeftCorner, topLeftCorner, topRightCorner, bottomRightCorner];
    const bottomLeftCornerIndex = 0;
    return {cutterPath, bottomLeftCornerIndex};
  }

  // 创建齿刀路径
  createToothCutterPaths() {
    const [r, ra] = this.getGearParams(["pitchRadius", "addendumRadius"]);

    const angleStepSize = Math.PI / 600;
    const {cutterPath, bottomLeftCornerIndex} = this.createToothCutter();
    const cutterPaths = [cutterPath];

    let stepCounter = 0;
    while (true) {
      const angle = stepCounter * angleStepSize;
      const xTranslation = angle * r;
      let transformedCutterPath = this.translatePath(cutterPath, -xTranslation, 0);
      transformedCutterPath = this.rotatePathAroundCenter(transformedCutterPath, this.ORIGIN, angle);
      cutterPaths.push(transformedCutterPath);

      transformedCutterPath = this.translatePath(cutterPath, xTranslation, 0);
      transformedCutterPath = this.rotatePathAroundCenter(transformedCutterPath, this.ORIGIN, -angle);
      cutterPaths.unshift(transformedCutterPath);

      stepCounter++;
      if (this.vectorLength(transformedCutterPath[bottomLeftCornerIndex]) > ra) {
        break;
      }
    }

    return {cutterPaths, bottomLeftCornerIndex};
  }

  // 创建齿切割路径
  createToothCutoutPath() {
    const {cutterPaths, bottomLeftCornerIndex} = this.createToothCutterPaths();

    const cornersPath = cutterPaths.map(path => this.clonePoint(path[bottomLeftCornerIndex]));
    cornersPath.reverse();

    const combinedPaths = [...cutterPaths, cornersPath];
    const clipper = new ClipperLib.Clipper();
    combinedPaths.forEach(path => {
      ClipperLib.JS.ScaleUpPath(path, this.CLIPPER_SCALE);
      clipper.AddPath(path, ClipperLib.PolyType.ptSubject, true);
    });

    const solutionPaths = new ClipperLib.Paths();
    const succeeded = clipper.Execute(ClipperLib.ClipType.ctUnion, solutionPaths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

    return solutionPaths[0];
  }

  // 创建一半的齿路径
  createHalfToothPath(group) {
    const [p, ra, ha, r] = this.getGearParams(["circularPitch", "addendumRadius", "addendum", "pitchRadius"]);
    const toothCutoutPath = this.createToothCutoutPath();

    const angle = this.params.angleToothToTooth / 2;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const halfPointOnCircle = {
      X: -ra * sinAngle,
      Y: -ra * cosAngle
    };
    const tangentIntercept = {
      X: 0,
      Y: -ra * (cosAngle + sinAngle * sinAngle / cosAngle)
    };

    const intersectPath = [
      this.ORIGIN,
      halfPointOnCircle,
      tangentIntercept
    ];
    // if (group) {
    //   const path = group.path();
    //   this.drawCircle(group, this.ORIGIN, 0.1)
    //   this.drawCircle(group, halfPointOnCircle, 0.1)
    //   this.drawCircle(group, tangentIntercept, 0.1)
    //   path.M(this.createSVGPoint(intersectPath[0]));
    //   intersectPath.slice(1).forEach(p => path.L(this.createSVGPoint(p)))
    //   path.L(this.createSVGPoint(intersectPath[0]));
    // }
    ClipperLib.JS.ScaleUpPath(intersectPath, this.CLIPPER_SCALE);

    const clipper = new ClipperLib.Clipper();
    clipper.AddPath(toothCutoutPath, ClipperLib.PolyType.ptSubject, true);
    clipper.AddPath(intersectPath, ClipperLib.PolyType.ptClip, true);

    const solutionPaths = new ClipperLib.Paths();
    const succeeded = clipper.Execute(ClipperLib.ClipType.ctIntersection, solutionPaths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

    const lightenedPaths = ClipperLib.JS.Lighten(solutionPaths[0], p * this.CLIPPER_LIGHTEN_FACTOR * this.CLIPPER_SCALE);
    const clippedToothCutoutPath = lightenedPaths[0];

    ClipperLib.JS.ScaleDownPath(clippedToothCutoutPath, this.CLIPPER_SCALE);
    // if (group) {
    //   const path = group.path().stroke({color: "red"});
    //   const pa = clippedToothCutoutPath;
    //   console.log(pa)
    //   path.M(this.createSVGPoint(pa[0]));
    //   let i = 0;
    //   pa.slice(1).forEach(p => path.L(this.createSVGPoint(p)));
    //   // pa.slice(1).forEach(p => setTimeout(() => path.L(this.createSVGPoint(p)), 2000 + 100 * i++));
    //   path.L(this.createSVGPoint(pa[0]));
    // }

    const dedendumStartIndex = clippedToothCutoutPath.findIndex(point => Math.abs(point.X) < 0.01 * ha && Math.abs(point.Y) < r);
    const halfToothPath = [clippedToothCutoutPath[dedendumStartIndex]];
    let curIdx = dedendumStartIndex;
    const squaredOuterRadius = this.square(ra);
    const getNextIndex = (index) => (index + 1) % clippedToothCutoutPath.length;
    while (true) {
      const nextIdx = getNextIndex(curIdx);
      if (this.squaredVectorLength(clippedToothCutoutPath[nextIdx]) >= squaredOuterRadius) {
        break;
      }
      curIdx = nextIdx;
      halfToothPath.push(clippedToothCutoutPath[curIdx]);
    }

    const lastInsidePoint = clippedToothCutoutPath[curIdx];
    const lastInsideLength = this.vectorLength(lastInsidePoint);
    const firstOnOrOutsidePoint = clippedToothCutoutPath[getNextIndex(curIdx)];
    const firstOnOrOutsideLength = this.vectorLength(firstOnOrOutsidePoint);
    const ratio = (ra - lastInsideLength) / (firstOnOrOutsideLength - lastInsideLength);
    const vectorBetweenPoints = this.subtractVectors(firstOnOrOutsidePoint, lastInsidePoint);
    const pointOnOuterRadius = this.addVectors(lastInsidePoint, this.numericalMultiplyVector(ratio, vectorBetweenPoints));
    halfToothPath.push(pointOnOuterRadius);
    // if (group) {
    //   const path = group.path().stroke({color: "red"});
    //   const pa = halfToothPath;
    //   console.log(pa)
    //   path.M(this.createSVGPoint(pa[0]));
    //   let i = 0;
    //   pa.slice(1).forEach(p => path.L(this.createSVGPoint(p)));
    //   // pa.slice(1).forEach(p => setTimeout(() => path.L(this.createSVGPoint(p)), 2000 + 100 * i++));
    // }

    return halfToothPath;
  }

  // 创建完整齿路径
  createToothPath(group) {
    const halfToothPath = this.createHalfToothPath();
    const mirroredHalfTooth = [...halfToothPath];
    mirroredHalfTooth.reverse().pop();
    const toothPath = [...mirroredHalfTooth.map(point => this.createPoint(-point.X, point.Y)), ...halfToothPath];
    // if (group) {
    //   const path = group.path().stroke({color: "red"});
    //   const pa = toothPath;
    //   console.log(pa)
    //   path.M(this.createSVGPoint(pa[0]));
    //   let i = 0;
    //   pa.slice(1).forEach(p => setTimeout(() => path.L(this.createSVGPoint(p)), 0));
    // }
    return toothPath;
  }

  // 插入齿轮SVG路径
  insertGearSVGPath(group) {
    const [z, ra] = this.getGearParams(["toothNumber", "addendumRadius"]);
    const SVGPath = group.path().stroke({linecap: "round"});
    // const angleOffset = -Math.PI / 2 - this.params.angleToothToTooth / 2;
    const angleOffset = 0;

    const gp = group.group().stroke({color: "red"});

    let firstSVGPoint;
    // for (let i = 0; i < z; i++) {
    for (const i of [0, 1, z - 1]) {
      const angle = i * this.params.angleToothToTooth + angleOffset;
      const rotatedToothPoints = this.rotatePathAroundCenter(this.toothPointsTemplate, this.ORIGIN, -angle);
      if (i === 0) {
        firstSVGPoint = this.createSVGPoint(rotatedToothPoints[0]);
        this.addLineSegmentsToPath(SVGPath, rotatedToothPoints, true);
      } else {
        if (i === 1) {
          SVGPath.A(ra, ra, 0, 0, 0, this.createSVGPoint(rotatedToothPoints[0]));
        }
        // gp.circle(0.02).center(rotatedToothPoints[0].X, rotatedToothPoints[0].Y);
        this.addLineSegmentsToPath(SVGPath, rotatedToothPoints, i !== 1);
      }
    }

    // gp.circle(0.02).center(firstSVGPoint.x, firstSVGPoint.y);

    SVGPath.A(ra, ra, 0, 0, 0, firstSVGPoint);
    SVGPath.L(firstSVGPoint);
    // SVGPath.Z();
  }

  /** 以下是工具方法 **/
  // 字符串对象转数字对象（用于计算）
  stringObjToNumberObj(obj) {
    const res = {};
    Object.entries(obj).forEach(([k, v]) => res[k] = Number(v));
    return res;
  }

  // 数字对象转字符串对象（用于表格显示）
  numberObjToStringObj(obj) {
    const res = {};
    Object.entries(obj).forEach(([k, v]) => res[k] = String(v));
    return res;
  }

  // 浮点数计算处理
  floatCalculation(res) {
    return parseFloat(res.toFixed(10));
  }

  // 根据字符串获得齿轮参数
  getGearParam(prop) {
    return this.params["gear" + prop[0].toUpperCase() + prop.slice(1)];
  }

  // 根据多个字符串获得齿轮参数
  getGearParams(props) {
    return props.map(prop => this.getGearParam(prop));
  }

  // 弧度转角度
  radToDeg(rad) {
    return rad / Math.PI * 180;
  }

  // 角度转弧度
  degToRad(deg) {
    return deg / 180 * Math.PI;
  }

  // 点
  createPoint(x, y) {
    return {X: x, Y: y};
  }

  // SVG点
  createSVGPoint(point) {
    return {x: point.X, y: point.Y};
  }

  // 克隆点
  clonePoint(point) {
    return {X: point.X, Y: point.Y};
  }

  // 平移点
  translatePoint(point, dx, dy) {
    return {X: point.X + dx, Y: point.Y + dy};
  }

  // 平移路径（点集）
  translatePath(path, dx, dy) {
    return path.map(point => this.translatePoint(point, dx, dy));
  }

  // 根据向量平移点
  translatePointByVector(point, vector) {
    return {X: point.X + vector.X, Y: point.Y + vector.Y};
  }

  // 根据向量平移点集
  translatePathByVector(path, vector) {
    return path.map(point => this.translatePointByVector(point, vector));
  }

  // 平方
  square(x) {
    return x * x;
  }

  // 两点距离的平方
  squaredPointsDistance(p1, p2) {
    return this.square(p1.X - p2.X) + this.square(p1.Y - p2.Y);
  }

  // 两点距离
  pointsDistance(p1, p2) {
    return Math.sqrt(this.squaredPointsDistance(p1, p2));
  }

  // 两点中点
  pointsMidpoint(p1, p2) {
    return {X: (p1.X + p2.X) / 2, Y: (p1.Y + p2.Y) / 2};
  }

  // 向量长度的平方
  squaredVectorLength(vector) {
    return this.square(vector.X) + this.square(vector.Y);
  }

  // 向量长度
  vectorLength(vector) {
    return Math.sqrt(this.squaredVectorLength(vector));
  }

  // 向量之和
  addVectors(v1, v2) {
    return {X: v1.X + v2.X, Y: v1.Y + v2.Y};
  }

  // 向量之差
  subtractVectors(v1, v2) {
    return this.addVectors(v1, this.numericalMultiplyVector(-1, v2));
  }

  // 向量数乘
  numericalMultiplyVector(a, vector) {
    return {X: a * vector.X, Y: a * vector.Y};
  }

  // 画圆
  drawCircle(parent, center, radius) {
    parent.circle(2 * radius).cx(center.X).cy(center.Y);
  }

  // 画多个圆（相同半径）
  drawCircles(parent, centers, radius) {
    centers.forEach(center => this.drawCircle(parent, center, radius));
  }

  // 画线（根据起点和终点）
  drawLine(parent, start, end) {
    parent.line(start.X, start.Y, end.X, end.Y);
  }

  // 画交叉线
  drawCross(parent, center, length) {
    const half = length / 2;
    const start1 = this.addVectors(center, this.createPoint(-half, 0));
    const end1 = this.addVectors(center, this.createPoint(half, 0));
    const start2 = this.addVectors(center, this.createPoint(0, -half));
    const end2 = this.addVectors(center, this.createPoint(0, half));
    this.drawLine(parent, start1, end1);
    this.drawLine(parent, start2, end2);
  }

  // 将点旋转一个角度（弧度制），逆时针为正，顺时针为负
  rotatePointAroundCenter(point, center, angle) {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const movedPoint = this.subtractVectors(point, center);
    const rotatedPoint = {
      X: movedPoint.X * cosAngle - movedPoint.Y * sinAngle,
      Y: movedPoint.X * sinAngle + movedPoint.Y * cosAngle
    }
    return this.addVectors(rotatedPoint, center);
  }

  // 将路径（点集）旋转一个角度
  rotatePathAroundCenter(path, center, angle) {
    return path.map(point => this.rotatePointAroundCenter(point, center, angle));
  }

  // 将线段添加到SVG路径
  addLineSegmentsToPath(SVGPath, points, moveToFirst = false) {
    for (let i = 0; i < points.length; i++) {
      const SVGPoint = this.createSVGPoint(points[i]);
      if (i === 0 && moveToFirst) {
        SVGPath.M(SVGPoint);
      } else {
        SVGPath.L(SVGPoint);
      }
    }
  }
}


new Vue({
  el: '#app',
  data() {
    return {
      // 模型对象
      model: null,
      // 参数信息列表、参数表单
      paramInfoList: [],
      paramForm: {},
      // SVG对象
      drawing: null,
      mainGroup: null,
      ORIGIN: {X: 0, Y: 0},
      exportedSVG: "",
      // 窗口信息
      drawingWidth: 0,
      drawingHeight: 0,
      // 线条样式
      helperLinesStyle: {color: "blue", width: 0.04, dasharray: "2,0.4,0.2,0.4"},
      regularLinesStyle: {color: "black", width: 0.1},
      markerLinesStyle: {color: "red", width: 0.04}
    }
  },
  created() {

  },
  mounted() {
    this.init();
    this.getParamInfoList();
    this.generate();
  },
  methods: {
    // 初始化
    init() {
      const drawingDiv = document.getElementById("drawing");
      this.drawingWidth = 800;
      this.drawingHeight = 800;
      // this.drawingWidth = 600;
      // this.drawingHeight = 350;
      drawingDiv.style.width = this.drawingWidth + "px";
      drawingDiv.style.height = this.drawingHeight + "px";

      this.drawing = SVG("drawing");
    },

    // 获取参数信息列表
    getParamInfoList() {
      this.paramInfoList = [
        {
          label: "齿轮模数",
          symbol: "m",
          prop: "gearModulus",
          initial: "2.5"
        },
        {
          label: "齿轮齿数",
          symbol: "z",
          prop: "gearToothNumber",
          initial: "18"
        },
        {
          label: "压力角",
          symbol: "α",
          prop: "gearPressureAngle",
          initial: "20"
        },
        {
          label: "齿顶高系数",
          symbol: "ha*",
          prop: "gearAddendumCoefficient",
          initial: "1"
        },
        {
          label: "顶隙系数",
          symbol: "c*",
          prop: "gearClearanceCoefficient",
          initial: "0.25"
        },
        {
          label: "中心孔直径",
          symbol: "dh",
          prop: "gearCenterHoleDiameter",
          initial: "5"
        },
        {
          label: "齿顶高",
          symbol: "ha",
          prop: "gearAddendum",
        },
        {
          label: "顶隙",
          symbol: "c",
          prop: "gearClearance",
        },
        {
          label: "齿根高",
          symbol: "hf",
          prop: "gearDedendum",
        },
        {
          label: "齿顶圆直径",
          symbol: "da",
          prop: "gearAddendumDiameter",
        },
        {
          label: "分度圆直径",
          symbol: "d",
          prop: "gearPitchDiameter",
        },
        {
          label: "齿根圆直径",
          symbol: "df",
          prop: "gearDedendumDiameter",
        },
        {
          label: "基圆直径",
          symbol: "db",
          prop: "gearBaseCircleDiameter",
        },
        {
          label: "齿距",
          symbol: "p",
          prop: "gearCircularPitch",
        },
        {
          label: "齿厚",
          symbol: "s",
          prop: "gearToothThickness",
        }
      ];
      this.paramInfoList.forEach(item => this.paramForm[item.prop] = item.initial || '');
    },

    // 生成
    generate() {
      const status = this.getNewModel();
      if (!status.ok()) {
        alert(status.message);
        return;
      }
      this.display();
    },

    getNewModel() {
      this.model = new Model(this.paramForm);
      const status = this.model.checkParams();
      if (!status.ok()) {
        return status;
      }
      this.paramForm = this.model.calculateParams();
      // this.ORIGIN = {
      //   X: 0,
      //   Y: -(+this.paramForm.gearBaseCircleRadius + +this.paramForm.gearPitchRadius) / 2
      // }
      this.model.setCenter(this.ORIGIN);
      this.model.generate();
      return Status.OK;
    },

    display() {
      this.drawing.clear();
      const topGroup = this.drawing.group();
      topGroup.panZoom();

      const borderRatio = 0.02;
      const border = borderRatio * Math.max(this.model.position.width, this.model.position.height);
      const totalWidth = this.model.position.width + 2 * border;
      const totalHeight = this.model.position.height + 2 * border;

      const scalingFactor = Math.min(this.drawingWidth / totalWidth, this.drawingHeight / totalHeight);
      // const scalingFactor = this.drawingWidth / totalWidth * 3;
      this.mainGroup = topGroup.group().scale(scalingFactor, scalingFactor).x(-this.model.position.center.X).y(-this.model.position.center.Y);
      this.mainGroup.dx(this.drawingWidth / scalingFactor / 2);
      this.mainGroup.dy(this.drawingHeight / scalingFactor / 2);

      this.mainGroup.stroke(this.regularLinesStyle).fill("none");

      this.model.createGraphics(this.mainGroup, this.regularLinesStyle, this.helperLinesStyle, this.markerLinesStyle);
    },

    // 导出SVG
    handleExportSVG() {
      this.exportedSVG = this.drawing.exportSvg({whitespace: true});
      const blob = new Blob([this.exportedSVG], {type: "image/svg+xml"});
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.setAttribute("style", "display: none");
      a.setAttribute("href", objUrl);
      a.setAttribute("type", "image/svg+xml")
      a.setAttribute("download", `SVG Drawing-envelope-${new Date().toLocaleString().replace(/\/(\d+)/g, (_, p1) => p1.length === 1 ? '0' + p1 : p1).replace(/[ :]/g, "")}.svg`);
      a.click();
      URL.revokeObjectURL(objUrl);
      document.body.removeChild(a);
    }
  }
});
