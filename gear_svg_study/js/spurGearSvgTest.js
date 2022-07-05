import SpurGear from "./SpurGear.js";
import Status from "./Status.js";

new Vue({
  el: '#app',
  data() {
    return {
      // 齿轮对象
      gear: null,
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
      helperLinesStyle: {color: "blue", width: 0.04},
      regularLinesStyle: {color: "black", width: 0.1},
      markerLinesStyle: {color: "red", width: 0.04}
    }
  },
  created() {

  },
  mounted() {
    this.init();
    this.getParamInfoList();
    this.handleUpdate();
  },
  methods: {
    // 初始化
    init() {
      const drawingDiv = document.getElementById("drawing");
      this.drawingWidth = 800;
      this.drawingHeight = 800;
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
          type: "input",
          initial: "2.5"
        },
        {
          label: "齿轮齿数",
          symbol: "z",
          prop: "gearToothNumber",
          type: "input",
          initial: "15"
        },
        {
          label: "压力角",
          symbol: "α",
          prop: "gearPressureAngle",
          type: "input",
          initial: "20"
        },
        {
          label: "齿顶高系数",
          symbol: "ha*",
          prop: "gearAddendumCoefficient",
          type: "input",
          initial: "1"
        },
        {
          label: "顶隙系数",
          symbol: "c*",
          prop: "gearClearanceCoefficient",
          type: "input",
          initial: "0.25"
        },
        {
          label: "中心孔直径",
          symbol: "dh",
          prop: "gearCenterHoleDiameter",
          type: "input",
          initial: "5"
        },
        {
          label: "齿顶高",
          symbol: "ha",
          prop: "gearAddendum",
          type: "input",
          disabled: true
        },
        {
          label: "顶隙",
          symbol: "c",
          prop: "gearClearance",
          type: "input",
          disabled: true
        },
        {
          label: "齿根高",
          symbol: "hf",
          prop: "gearDedendum",
          type: "input",
          disabled: true
        },
        {
          label: "齿顶圆直径",
          symbol: "da",
          prop: "gearAddendumDiameter",
          type: "input",
          disabled: true
        },
        {
          label: "分度圆直径",
          symbol: "d",
          prop: "gearPitchDiameter",
          type: "input",
          disabled: true
        },
        {
          label: "齿根圆直径",
          symbol: "df",
          prop: "gearDedendumDiameter",
          type: "input",
          disabled: true
        },
        {
          label: "基圆直径",
          symbol: "db",
          prop: "gearBaseCircleDiameter",
          type: "input",
          disabled: true
        },
        {
          label: "齿距",
          symbol: "p",
          prop: "gearCircularPitch",
          type: "input",
          disabled: true
        },
        {
          label: "齿厚",
          symbol: "s",
          prop: "gearToothThickness",
          type: "input",
          disabled: true
        }
      ];
      this.paramInfoList.forEach(item => this.paramForm[item.prop] = item.initial || '');
    },

    onInput($event) {
      this.$forceUpdate();
    },

    // 生成齿轮对象
    getNewGear() {
      this.gear = new SpurGear(this.paramForm);
      const status = this.gear.checkParams();
      if (!status.ok()) {
        return status;
      }
      this.paramForm = this.gear.calculateParams();
      this.gear.setCenter(this.ORIGIN);
      this.gear.update();
      return Status.OK;
    },

    // 展示齿轮
    displayGear() {
      this.drawing.clear();
      const topGroup = this.drawing.group();
      topGroup.panZoom();

      const borderRatio = 0.02;
      const border = borderRatio * Math.max(this.gear.position.width, this.gear.position.height);
      const totalWidth = this.gear.position.width + 2 * border;
      const totalHeight = this.gear.position.height + 2 * border;

      const scalingFactor = Math.min(this.drawingWidth / totalWidth, this.drawingHeight / totalHeight);
      this.mainGroup = topGroup.group().scale(scalingFactor, scalingFactor).x(-this.gear.position.center.X).y(-this.gear.position.center.Y);
      this.mainGroup.dx(this.drawingWidth / scalingFactor / 2);
      this.mainGroup.dy(this.drawingHeight / scalingFactor / 2);

      this.mainGroup.stroke(this.regularLinesStyle).fill("none");

      const crossMarkerLength = Math.min(this.gear.params.gearCircularPitch / 2, this.gear.position.width / 30);
      this.gear.createGraphics(this.mainGroup, crossMarkerLength, this.regularLinesStyle, this.helperLinesStyle, this.markerLinesStyle);
    },

    // 给出导出SVG
    giveExportedSVG() {
      const pxPerMm = 3.543307;

      const borderRatio = 0.05;
      const border = borderRatio * Math.max(this.gear.position.width, this.gear.position.height);
      const totalWidth = this.gear.position.width + 2 * border;
      const totalHeight = this.gear.position.height + 2 * border;

      const drawingForExport = SVG("drawingForExport")
          .size(totalWidth + "mm", totalHeight + "mm")
          .viewbox(this.gear.position.left - border, -this.gear.position.top - border, totalWidth, totalHeight);
      const topGroup = drawingForExport.group();
      const crossMarkerLength = Math.min(this.gear.params.gearCircularPitch / 2, this.gear.position.width / 50);
      this.gear.createGraphics(topGroup, crossMarkerLength, this.regularLinesStyle, this.helperLinesStyle, this.markerLinesStyle);
      const exportedSVG = drawingForExport.exportSvg({whitespace: true});
      document.getElementById("SVGCode").innerText = exportedSVG;
      this.exportedSVG = exportedSVG;
    },

    // 更新操作
    handleUpdate() {
      const status = this.getNewGear();
      if (!status.ok()) {
        alert(status.message);
        return;
      }
      this.displayGear();
      this.giveExportedSVG();
    },

    // 下载SVG操作
    handleDownloadSVG() {
      const blob = new Blob([this.exportedSVG], {type: "image/svg+xml"});
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.setAttribute("style", "display: none");
      a.setAttribute("href", objUrl);
      a.setAttribute("type", "image/svg+xml")
      a.setAttribute("download", `spur_gear_of_m=${this.gear.params.gearModulus ? this.gear.params.gearModulus : 0}_and_z=${this.gear.params.gearToothNumber ? this.gear.params.gearToothNumber : 0}.svg`);
      a.click();
      URL.revokeObjectURL(objUrl);
      document.body.removeChild(a);
    }
  },
})