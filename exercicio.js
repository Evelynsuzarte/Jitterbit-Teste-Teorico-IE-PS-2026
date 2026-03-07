//8 Escreva uma função em JavaScript chamada “somaImpares” 
//que recebe um número inteiro positivo “n” como parâmetro 
//e retorna a soma de todos os números ímpares de 1 até n


function somaImpares (n){
    somador = 0;
    for (let i = 1; i <= n; i++){
        if (i % 2 != 0 && i>0){
            somador = somador + i
        }
    }
    return somador;
}


console.log(somaImpares(5));
console.log(somaImpares(10));



//9  Escreva uma função chamada” inverterPalavra” que recebe uma string 
// como parâmetro e retorna a string com as letras invertidas.

function inverterPalavra(palavra){
    palavraInvertida = []
    for (let i = palavra.length - 1; i >= 0; i--) {
        palavraInvertida += palavra[i];
    }
    return palavraInvertida;
}
console.log(inverterPalavra ("javascript"));


//11 Como você pode percorrer e mapear um array JSON em JavaScript? 
// Explique como usar métodos como "map", "forEach" ou "for...of" 
// para iterar e manipular os elementos do array. 

const usuarios = [
  { 
    id: 1, 
    nome: "Ana",
    idade: 24, 
    ativo: true 
},
{ 
    id: 2, 
    nome: "Beto", 
    idade: 31,
    ativo: false 
},
{ 
    id: 3, 
    nome: "Pedrinho", 
    idade: 15,
    ativo: true 
}
];

const novaIdade = usuarios.map(usuario => {
    return {
        ...usuario,
        idade: usuario.idade+5
    };
});
console.log(novaIdade);


usuarios.forEach((usuario, index) => {
  console.log(`usuario ${index}: ${usuario.nome}`);
});


for (const usuario of usuarios) {
  if (usuario.ativo) {
    console.log(`${usuario.nome} está online!`);
  }
}