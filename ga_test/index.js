class Code {
  constructor(value) {
    this.value = value ?? 0;
  }
}

class Gene {
  constructor() {
    this.codes = new Array(6).fill(0).map(() => new Code());
    [this.x1, this.x2] = [0, 0];
    this.fitness = 0;
    this.probability = 0;
  }

  toString(r, m = false) {
    const string = this.codes.map(code => code.value).join("");
    if (r !== undefined) {
      if (m) {
        return string.slice(0, r) + "[" + string[r] + "]" + string.slice(r + 1);
      }
      return string.slice(0, r) + "|" + string.slice(r);
    }
    return string;
  }

  generate() {
    this.codes.forEach(code => code.value = Math.floor(Math.random() * 2));
  }

  decode() {
    this.x1 = this.codes.slice(0, 3).reduce((acc, code) => acc * 2 + code.value, 0);
    this.x2 = this.codes.slice(3, 6).reduce((acc, code) => acc * 2 + code.value, 0);
  }

  evaluate() {
    this.fitness = Math.abs(this.x1 * this.x1 + this.x2 * this.x2);
  }

  static clone(codes) {
    const gene = new Gene();
    gene.codes = codes.map(code => new Code(code.value));
    gene.decode();
    gene.evaluate();
    return gene;
  }
}

class Population {
  constructor() {
    this.genes = new Array(4).fill(0).map(() => new Gene());
    this.sumFitness = 0;
    this.selectionString = "";
    this.crossoverString = "";
    this.mutationString = "";
  }

  toInitialString() {
    return this.genes.map((gene, idx) => `${idx + 1}:  ${gene.toString()}  ${gene.x1}  ${gene.x2}  ${String(gene.fitness).padStart(2)}  ${gene.probability.toFixed(5)}`).join("\n");
  }

  toSelectionString() {
    return this.selectionString;
  }

  toCrossoverString() {
    return this.crossoverString;
  }

  toMutationString() {
    return this.mutationString;
  }

  generate() {
    this.genes.forEach(gene => gene.generate());
  }

  decode() {
    this.genes.forEach(gene => gene.decode());
  }

  evaluate() {
    this.genes.forEach(gene => gene.evaluate());
  }

  beforeSelection() {
    this.sumFitness = this.genes.reduce((acc, gene) => acc + gene.fitness, 0);
    this.genes.forEach(gene => gene.probability = gene.fitness / this.sumFitness);
  }

  selection() {
    const newGenes = new Array(4).fill(0).map(() => new Gene());
    for (let i = 0; i < 4; i++) {
      const r = Math.random();
      let sum = 0;
      for (let j = 0; j < 4; j++) {
        sum += this.genes[j].probability;
        if (r < sum) {
          newGenes[i] = Gene.clone(this.genes[j].codes);
          break;
        }
      }
    }
    this.selectionString = newGenes.map((gene, idx) => `${idx + 1}:  ${gene.toString()}  ${gene.x1}  ${gene.x2}  ${String(gene.fitness).padStart(2)}`).join("\n");
    this.genes = newGenes;
  }

  crossover() {
    const newGenes = [];
    const set = new Set(this.genes);
    const strings = [];
    for (let i = 0; i < 4; i += 2) {
      let r1 = -1, r2 = -1;
      while (!set.has(this.genes[r1])) {
        r1 = Math.floor(Math.random() * 4);
      }
      set.delete(this.genes[r1]);
      while (!set.has(this.genes[r2])) {
        r2 = Math.floor(Math.random() * 4);
      }
      set.delete(this.genes[r2]);
      if (r1 > r2) {
        [r1, r2] = [r2, r1];
      }
      const [gene1, gene2] = [this.genes[r1], this.genes[r2]];
      const r = Math.floor(Math.random() * 5) + 1;
      const newGene1 = Gene.clone([...gene1.codes.slice(0, r), ...gene2.codes.slice(r)]);
      const newGene2 = Gene.clone([...gene2.codes.slice(0, r), ...gene1.codes.slice(r)]);
      newGenes.push(newGene1, newGene2);
      strings.push(`${r1 + 1}:  ${gene1.toString(r)}  ${gene1.x1}  ${gene1.x2}  ${String(gene1.fitness).padStart(2)}  -->  ${newGene1.toString(r)}  ${newGene1.x1}  ${newGene1.x2}  ${String(newGene1.fitness).padStart(2)}`);
      strings.push(`${r2 + 1}:  ${gene2.toString(r)}  ${gene2.x1}  ${gene2.x2}  ${String(gene2.fitness).padStart(2)}  -->  ${newGene2.toString(r)}  ${newGene2.x1}  ${newGene2.x2}  ${String(newGene2.fitness).padStart(2)}`);
    }
    this.crossoverString = strings.join("\n");
    this.genes = newGenes;
  }

  mutation() {
    const newGenes = [];
    const strings = [];
    for (let i = 0; i < 4; i++) {
      const gene = this.genes[i];
      const r = Math.floor(Math.random() * 6);
      gene.codes[r].value = 1 - gene.codes[r].value;
      const newGene = Gene.clone(gene.codes);
      gene.codes[r].value = 1 - gene.codes[r].value;
      newGenes.push(newGene);
      strings.push(`${i + 1}:  ${gene.toString(r, true)}  ${gene.x1}  ${gene.x2}  ${String(gene.fitness).padStart(2)}  -->  ${newGene.toString(r, true)}  ${newGene.x1}  ${newGene.x2}  ${String(newGene.fitness).padStart(2)}`);
    }
    this.mutationString = strings.join("\n");
    this.genes = newGenes;
  }

  pushMax(res) {
    res.push(this.genes.reduce((max, gene) => gene.fitness > max.fitness ? gene : max, this.genes[0]));
  }
}

const res = [];
const population = new Population();
population.generate();
population.decode();
population.evaluate();
population.beforeSelection();
console.log("------------------");
console.log("Initial population:");
console.log(population.toInitialString());
console.log("------------------");
for (let it = 1; it <= 5; it++) {
  population.beforeSelection();
  console.log(`Iteration ${it}:`);
  console.log("Selection:");
  population.selection();
  console.log(population.toSelectionString());
  console.log("Crossover:");
  population.crossover();
  console.log(population.toCrossoverString());
  console.log("Mutation:");
  population.mutation();
  console.log(population.toMutationString());
  console.log("------------------");
  population.pushMax(res);
}

const [ans, it] = res.reduce((acc, gene, idx) => gene.fitness > acc[0].fitness ? [gene, idx] : acc, [res[0], 0]);

console.log("Result:");
console.log(res.map(gene => gene.fitness));
console.log("From iteration", it + 1);
console.log(`${ans.toString()}  ${ans.x1}  ${ans.x2}  ${String(ans.fitness).padStart(2)}`);
