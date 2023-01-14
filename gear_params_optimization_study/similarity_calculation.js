import originData from "./originData.js";
import testData from "./testData.js";

const keys = Object.keys(testData);

function getPropertyMaxsMins(origin, keys) {
  const m = keys.length;
  const maxs = new Array(m).fill(0), mins = new Array(m).fill(0);
  for (let j = 0; j < m; j++) {
    const originValues = origin.map(x => x[keys[j]]);
    maxs[j] = Math.max(...originValues);
    mins[j] = Math.min(...originValues);
  }
  return { maxs, mins };
}

function getLocalSimilarity(a, b, max, min) {
  return 1 - Math.abs(a - b) / (max - min);
}

function getOverallSimilarity(origin, test) {
  const n = origin.length;
  const m = keys.length;
  const { maxs, mins } = getPropertyMaxsMins(origin, keys);
  const S = new Array(n).fill(0).map(() => new Array(m).fill(0));
  for (let j = 0; j < m; j++) {
    const max = maxs[j], min = mins[j];
    for (let i = 0; i < n; i++) {
      S[i][j] = getLocalSimilarity(test[keys[j]], origin[i][keys[j]], max, min);
    }
  }
  return S;
}

function getPropertyWeight(origin, test) {
  const n = origin.length;
  const keys = Object.keys(test), m = keys.length;
  const W = new Array(m).fill(0);
  const S = getOverallSimilarity(origin, test);
  let sum = 0;
  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      for (let k = i + 1; k < n; k++) {
        W[j] += (S[i][j] - S[k][j]) ** 2;
      }
    }
    sum += W[j];
  }
  for (let j = 0; j < m; j++) {
    W[j] /= sum;
  }
  return scalingWeight(W);
}

function scalingWeight(W) {
  const min = Math.min(...W);
  const scale = 1 / min;
  return W.map(x => x * scale);
}

function getEvaluationMatrix(W) {
  const n = W.length;
  const map = [1, 1.05, 1.15, 1.35, 1.75, 2.55, 4.15, 7.35, 13.75];
  const P = new Array(n).fill(0).map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (W[i] >= W[j]) {
        const times = W[i] / W[j];
        const idx = map.findIndex(x => x > times);
        P[i][j] = idx === -1 ? 9 : idx;
        P[j][i] = 1 / P[i][j];
      }
    }
  }
  return P;
}

function normalizeTwoDimensionalMatrix(P) {
  const m = P.length, n = P[0].length;
  const colSum = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < m; i++) {
      colSum[j] += P[i][j];
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < m; i++) {
      P[i][j] /= colSum[j];
    }
  }
  const W = P.map(x => x.reduce((a, b) => a + b));
  const sum = W.reduce((a, b) => a + b);
  return W.map(x => x / sum);
}

function getCasesSimilarity(W, origin, test) {
  const n = origin.length;
  const keys = Object.keys(test), m = keys.length;
  const { maxs, mins } = getPropertyMaxsMins(origin, keys);
  const SIM = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const max = maxs[j], min = mins[j];
      SIM[i] += W[j] * getLocalSimilarity(test[keys[j]], origin[i][keys[j]], max, min);
    }
  }
  return SIM;
}

const W = getPropertyWeight(originData, testData);
console.log(W);
const P = getEvaluationMatrix(W);
console.log(P);
const W2 = normalizeTwoDimensionalMatrix(P);
console.log(W2);
const SIM = getCasesSimilarity(W2, originData, testData);
console.log(SIM);
