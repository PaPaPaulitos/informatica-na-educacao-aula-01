import type { TheoryId } from "./types";

export interface Theory {
  id: TheoryId;
  number: number;
  title: string;
  author: string;
  body: string;
}

export const THEORIES: Theory[] = [
  {
    id: "carga-cognitiva",
    number: 1,
    title: "Teoria da Carga Cognitiva",
    author: "John Sweller",
    body: "A memória de trabalho humana possui uma capacidade estritamente limitada para processar novas informações simultaneamente (geralmente retendo de 3 a 7 itens por vez). Se um aluno é exposto a muitos elementos interativos, informações redundantes ou uma interface confusa, ocorre uma \"sobrecarga\" cognitiva. A aprendizagem efetiva e a transferência de conhecimento para a memória de longo prazo só acontecem quando a apresentação da informação é otimizada, eliminando o processamento mental desnecessário.",
  },
  {
    id: "zdp",
    number: 2,
    title: "Zona de Desenvolvimento Proximal — ZDP",
    author: "Lev Vygotsky",
    body: "A ZDP é a distância entre o nível de desenvolvimento real de um aluno (problemas que ele consegue resolver de forma independente) e o nível de desenvolvimento potencial (o que ele consegue alcançar com a orientação de um professor, colega ou sistema automatizado). O aprendizado não acontece na zona de conforto, nem na zona de pânico; ele ocorre nessa fronteira intermediária. Para que o aluno avance pela ZDP, ele precisa de scaffolding (andaimes estruturais) — suportes temporários que são gradualmente removidos à medida que ele ganha autonomia no conceito.",
  },
  {
    id: "reforco-variavel",
    number: 3,
    title: "Esquemas de Reforço Variável",
    author: "B.F. Skinner",
    body: "No condicionamento operante, um reforço é qualquer resposta que aumenta a probabilidade de um comportamento se repetir. O reforço variável (ou intermitente) ocorre quando a recompensa não é previsível nem garantida a cada ação. Em vez de receber um prêmio sempre que completa uma tarefa, o usuário recebe recompensas em intervalos aleatórios. Este é o mecanismo psicológico que gera a maior taxa de engajamento e resistência à desistência, sendo a base fundamental da gamificação, das mecânicas de drop em jogos e dos algoritmos de redes sociais.",
  },
];

export function getTheory(id: TheoryId): Theory | undefined {
  return THEORIES.find((theory) => theory.id === id);
}
