document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const payload = {
        distrito: document.getElementById('distrito').value,
        concelho: document.getElementById('concelho').value,
        data: document.getElementById('data').value,
        hora: document.getElementById('hora').value
    };

    fetch('procurar_fotografos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(json => {
        const grid = document.getElementById('fotografos-grid');
        grid.innerHTML = '';

        if (json.status !== 'success' || json.data.length === 0) {
            grid.innerHTML = '<p>Nenhum fotógrafo encontrado.</p>';
            return;
        }

        json.data.forEach(f => {
            grid.innerHTML += `
                <div class="fotografo-card">
                    <h3>${f.nome}</h3>
                    <p>${f.especialidade}</p>
                    <p>${f.distrito} - ${f.concelho}</p>
                    <p>${f.preco}€</p>
                    <button data-email="${f.email}">Reservar</button>
                </div>
            `;
        });
    })
    .catch(err => {
        console.error(err);
        alert('Erro ao procurar fotógrafos');
    });
});
