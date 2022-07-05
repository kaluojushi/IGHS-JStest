import Status from "./Status.js";

export default class SpurGear {
  constructor(form) {
    this.params = this.stringObjToNumberObj(form);
    this.position = {};
    this.ORIGIN = {X: 0, Y: 0};
    this.CLIPPER_SCALE = 100000;
    this.CLIPPER_LIGHTEN_FACTOR = 0.0005;
  }

  // 计算齿轮所有参数
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

  // 验证参数
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

  // 设置中心点
  setCenter(center) {
    this.position.center = this.clonePoint(center);
  }

  // 更新齿轮坐标与点集
  update() {
    const ra = this.getGearParam("addendumRadius");
    this.position.topLeft = this.addVectors(this.position.center, this.createPoint(-ra, ra));
    this.position.bottomRight = this.addVectors(this.position.center, this.createPoint(ra, -ra));
    this.position.width = this.position.bottomRight.X - this.position.topLeft.X;
    this.position.height = this.position.bottomRight.X - this.position.topLeft.X;
    this.position.left = this.position.topLeft.X;
    this.position.top = this.position.topLeft.Y;

    this.toothPointsTemplate = this.createToothPath();
    console.log(this.toothPointsTemplate)
  }

  // 绘画图形
  createGraphics(parent, crossMarkerLength, regularLinesStyle, helperLinesStyle, markerLinesStyle) {
    const gearGroup = parent.group();
    const helperGroup = gearGroup.group();
    helperGroup.stroke(helperLinesStyle).fill("none");

    // 绘画分度圆、齿顶圆、基圆、齿根圆
    this.drawCircle(helperGroup, this.ORIGIN, this.params.gearPitchRadius);
    this.drawCircle(helperGroup, this.ORIGIN, this.params.gearAddendumRadius);
    this.drawCircle(helperGroup, this.ORIGIN, this.params.gearBaseCircleRadius);
    this.drawCircle(helperGroup, this.ORIGIN, this.params.gearDedendumRadius);

    // 绘画标记线
    const markerGroup = gearGroup.group();
    markerGroup.stroke(markerLinesStyle).fill("none");
    this.drawCross(markerGroup, this.ORIGIN, crossMarkerLength);

    // 绘画中心孔
    const regularGroup = gearGroup.group();
    regularGroup.stroke(regularLinesStyle).fill("none");
    if (this.params.gearCenterHoleRadius > 0) {
      this.drawCircle(regularGroup, this.ORIGIN, this.params.gearCenterHoleRadius);
    }
    // 插入齿轮路径
    this.insertGearSVGPath(regularGroup);

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

    const bottomRightCorner = this.createPoint(s / 2 + dx - tanAlpha * cutterDepth, yBottom);
    const topRightCorner = this.createPoint(s / 2 + dx + tanAlpha * cutterOutsideLength, yTop);
    const topLeftCorner = this.createPoint(-topRightCorner.X, topRightCorner.Y);
    const bottomLeftCorner = this.createPoint(-bottomRightCorner.X, bottomRightCorner.Y);

    const cutterPath = [bottomLeftCorner, topLeftCorner, topRightCorner, bottomRightCorner];
    const bottomLeftCornerIndex = 0;
    return {cutterPath, bottomLeftCornerIndex};
  }

  // 创建齿刀路径
  createToothCutterPaths() {
    const [p, ra] = this.getGearParams(["pitchRadius", "addendumRadius"]);

    const angleStepSize = Math.PI / 600;
    const {cutterPath, bottomLeftCornerIndex} = this.createToothCutter();
    const cutterPaths = [cutterPath];

    let stepCounter = 0;
    while (true) {
      const angle = stepCounter * angleStepSize;
      const xTranslation = angle * p;
      let transformedCutterPath = this.translatePath(cutterPath, xTranslation, 0);
      transformedCutterPath = this.rotatePathAroundCenter(transformedCutterPath, this.ORIGIN, angle);
      cutterPaths.push(transformedCutterPath);

      transformedCutterPath = this.translatePath(cutterPath, -xTranslation, 0);
      transformedCutterPath = this.rotatePathAroundCenter(transformedCutterPath, this.ORIGIN, -angle);
      cutterPaths.unshift(transformedCutterPath);

      stepCounter++;
      if (this.vectorLength(transformedCutterPath[bottomLeftCornerIndex]) > ra) {
        break;
      }
    }

    // console.log(cutterPaths)
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

    // console.log(solutionPaths)
    return solutionPaths[0];
  }

  // 创建一半的齿路径
  createHalfToothPath() {
    const [p, ra, ha, r] = this.getGearParams(["circularPitch", "addendumRadius", "addendum", "pitchRadius"]);
    const toothCutoutPath = this.createToothCutoutPath();

    const angle = this.params.angleToothToTooth / 2;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const halfPointOnCircle = {
      X: -ra * sinAngle,
      Y: ra * cosAngle
    };
    const tangentIntercept = {
      X: 0,
      Y: ra * (cosAngle + sinAngle * sinAngle / cosAngle)
    };

    const intersectPath = [
      this.ORIGIN,
      halfPointOnCircle,
      tangentIntercept
    ];
    ClipperLib.JS.ScaleUpPath(intersectPath, this.CLIPPER_SCALE);

    const clipper = new ClipperLib.Clipper();
    clipper.AddPath(toothCutoutPath, ClipperLib.PolyType.ptSubject, true);
    clipper.AddPath(intersectPath, ClipperLib.PolyType.ptClip, true);

    const solutionPaths = new ClipperLib.Paths();
    const succeeded = clipper.Execute(ClipperLib.ClipType.ctIntersection, solutionPaths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

    const lightenedPaths = ClipperLib.JS.Lighten(solutionPaths[0], p * this.CLIPPER_LIGHTEN_FACTOR * this.CLIPPER_SCALE);
    const clippedToothCutoutPath = lightenedPaths[0];

    ClipperLib.JS.ScaleDownPath(clippedToothCutoutPath, this.CLIPPER_SCALE);

    const dedendumStartIndex = clippedToothCutoutPath.findIndex(point => Math.abs(point.X) < 0.01 * ha && point.Y < r);
    const halfToothPath = [clippedToothCutoutPath[dedendumStartIndex]];
    let curIdx = dedendumStartIndex;
    const squaredOuterRadius = this.square(ra);
    const getNextIndex = (index) => (index - 1 + clippedToothCutoutPath.length) % clippedToothCutoutPath.length;
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

    return halfToothPath;
  }

  // 创建完整齿路径
  createToothPath() {
    const halfToothPath = this.createHalfToothPath();
    const mirroredHalfTooth = [...halfToothPath];
    mirroredHalfTooth.reverse().pop();
    return [...mirroredHalfTooth.map(point => this.createPoint(-point.X, point.Y)), ...halfToothPath];
  }

  // 插入齿轮SVG路径
  insertGearSVGPath(group) {
    const [z, ra] = this.getGearParams(["toothNumber", "addendumRadius"]);
    const SVGPath = group.path();
    const angleOffset = -Math.PI / 2 - this.params.angleToothToTooth / 2;
    // const angleOffset = 0;

    let firstSVGPoint;
    for (let i = 0; i < z; i++) {
      const angle = i * this.params.angleToothToTooth + angleOffset;
      const rotatedToothPoints = this.rotatePathAroundCenter(this.toothPointsTemplate, this.ORIGIN, angle);
      if (i === 0) {
        firstSVGPoint = this.createSVGPoint(rotatedToothPoints[0]);
        this.addLineSegmentsToPath(SVGPath, rotatedToothPoints.slice(1), true);
      } else {
        SVGPath.A(ra, ra, 0, 0, 1, this.createSVGPoint(rotatedToothPoints[0]));
        this.addLineSegmentsToPath(SVGPath, rotatedToothPoints.slice(1));
      }
    }

    SVGPath.A(ra, ra, 0, 0, 1, firstSVGPoint);
    SVGPath.Z();
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