const vigilantes = [

  {
    nome:'João Silva',
    telefone:'(47) 99123-4567',
    rota:'Rota 1 - Moradas da Praia'
  },

  {
    nome:'Maria Costa',
    telefone:'(47) 99234-5678',
    rota:'Rota 2 - Condomínio Atlântico'
  },

  {
    nome:'Rafael Pereira',
    telefone:'(47) 99345-6789',
    rota:'Rota 3 - Praia Sul'
  },

  {
    nome:'Lucas Carvalho',
    telefone:'(47) 99567-8901',
    rota:'Rota 1 - Moradas da Praia'
  }

];

const cards = document.getElementById('cards');

function getInitials(nome){

  return nome
    .split(' ')
    .map(n => n[0])
    .slice(0,2)
    .join('');

}

function abrirVigilante(vigilante){

  document.getElementById('nomeView').innerText =
  vigilante.nome;

  document.getElementById('avatarText').innerText =
  getInitials(vigilante.nome);

  document.getElementById('nomeInput').value =
  vigilante.nome;

  document.getElementById('telefoneInput').value =
  vigilante.telefone;

  document.getElementById('rotaInput').value =
  vigilante.rota;

  document.getElementById('syncInput').value =
  vigilante.telefone;

}

function renderCards(){

  cards.innerHTML = '';

  vigilantes.forEach((vigilante,index)=>{

    const card = document.createElement('div');

    card.className = 'card';

    card.innerHTML = `

      <div class="avatar">
        ${getInitials(vigilante.nome)}
      </div>

      <h3>${vigilante.nome}</h3>

      <div class="phone">
        ${vigilante.telefone}
      </div>

      <div class="status">
        Ativo
      </div>

    `;

    card.addEventListener('click',()=>{

      abrirVigilante(vigilante);

    });

    cards.appendChild(card);

  });

}

renderCards();

/* BUSCA */

const busca = document.querySelector('.search input');

busca.addEventListener('input',(e)=>{

  const valor = e.target.value.toLowerCase();

  const filtrados = vigilantes.filter(v =>

    v.nome.toLowerCase().includes(valor) ||
    v.telefone.includes(valor)

  );

  cards.innerHTML = '';

  filtrados.forEach((vigilante)=>{

    const card = document.createElement('div');

    card.className = 'card';

    card.innerHTML = `

      <div class="avatar">
        ${getInitials(vigilante.nome)}
      </div>

      <h3>${vigilante.nome}</h3>

      <div class="phone">
        ${vigilante.telefone}
      </div>

      <div class="status">
        Ativo
      </div>

    `;

    card.addEventListener('click',()=>{

      abrirVigilante(vigilante);

    });

    cards.appendChild(card);

  });

});

/* NOVO VIGILANTE */

const novoBtn = document.querySelector('.novo-btn');

novoBtn.addEventListener('click',()=>{

  document.getElementById('nomeView').innerText =
  'Novo Vigilante';

  document.getElementById('avatarText').innerText =
  '+';

  document.getElementById('nomeInput').value = '';

  document.getElementById('telefoneInput').value = '';

  document.getElementById('rotaInput').selectedIndex = 0;

  document.getElementById('syncInput').value = '';

});

/* SALVAR */

const salvarBtn = document.querySelector('.btn.save');

salvarBtn.addEventListener('click',()=>{

  alert('Alterações salvas com sucesso!');

});

/* CANCELAR */

const cancelarBtn = document.querySelector('.btn.cancel');

cancelarBtn.addEventListener('click',()=>{

  location.reload();

});
