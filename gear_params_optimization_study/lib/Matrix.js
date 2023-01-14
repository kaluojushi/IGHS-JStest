export default class Matrix {
  static add(A, B) {
    return A.map((row, i) => row.map((cell, j) => cell + B[i][j]));
  }

  static subtract(A, B) {
    return this.add(A, this.getMinusMatrix(B));
  }

  static multiply(A, B) {
    const m = A.length, n = B[0].length, p = A[0].length;
    const C = new Array(m).fill(0).map(() => new Array(n).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < p; k++) {
          C[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return C;
  }

  static multiplyByScalar(A, k) {
    return A.map(row => row.map(cell => cell * k));
  }

  static power(A, k) {
    if (k === 0) {
      return this.createIdentityMatrix(A.length);
    }
    if (k === 1) {
      return A;
    }
    if (k % 2 === 0) {
      const B = this.power(A, k / 2);
      return this.multiply(B, B);
    }
    return this.multiply(A, this.power(A, k - 1));
  }

  static transpose(A) {
    return A[0].map((_, i) => A.map(row => row[i]));
  }

  static getInverse(A) {
    const det = this.determinant(A);
    if (det === 0) {
      return null;
    }
    const B = this.getAdjugate(A);
    return this.multiplyByScalar(B, 1 / det);
  }

  static getAdjugate(A) {
    const n = A.length;
    const B = new Array(n).fill(0).map(() => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        B[i][j] = this.cofactor(A, j, i);
      }
    }
    return B;
  }

  static getMinusMatrix(A) {
    return this.multiplyByScalar(A, -1);
  }

  static determinant(A) {
    const n = A.length;
    if (n === 1) {
      return A[0][0];
    }
    let det = 0;
    for (let j = 0; j < n; j++) {
      det += A[0][j] * this.cofactor(A, 0, j);
    }
    return det;
  }

  static cofactor(A, i, j) {
    const n = A.length;
    const B = new Array(n - 1).fill(0).map(() => new Array(n - 1).fill(0));
    for (let k = 0; k < n; k++) {
      if (k === i) {
        continue;
      }
      for (let l = 0; l < n; l++) {
        if (l === j) {
          continue;
        }
        B[k > i ? k - 1 : k][l > j ? l - 1 : l] = A[k][l];
      }
    }
    return ((i + j) % 2 === 0 ? 1 : -1) * this.determinant(B);
  }

  static createIdentityMatrix(n) {
    const A = new Array(n).fill(0).map(() => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      A[i][i] = 1;
    }
    return A;
  }

  static createZeroMatrix(m, n) {
    return new Array(m).fill(0).map(() => new Array(n).fill(0));
  }

  static createDiagonalMatrix(diagonal) {
    const n = diagonal.length;
    const A = new Array(n).fill(0).map(() => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      A[i][i] = diagonal[i];
    }
    return A;
  }



  static isEquals(A, B) {
    const m = A.length, n = A[0].length, p = B.length, q = B[0].length;
    if (m !== p || n !== q) {
      return false;
    }
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (A[i][j] !== B[i][j]) {
          return false;
        }
      }
    }
    return true;
  }
}
