import Matrix from "./lib/Matrix.js";

const A = [[1,3],[2,-2]];
const B = [[2,5],[3,4]];
const A$ = Matrix.getInverse(A);
console.log(Matrix.isEquals(Matrix.multiply(A, A$), Matrix.createIdentityMatrix(2)));
