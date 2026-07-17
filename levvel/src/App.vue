<script setup>
import { ref, onMounted } from 'vue'

// URL do seu Backend em FastAPI
const API_URL = 'http://localhost:8000/v1'

// Estados do componente
const logs = ref([])
const clienteId = ref('')
const agendamentoId = ref('')
const carregando = ref(false)

// Função auxiliar para exibir logs na tela
const adicionarLog = (acao, dados) => {
  logs.value.unshift({
    id: Date.now(),
    horario: new Date().toLocaleTimeString(),
    acao,
    dados: JSON.stringify(dados, null, 2)
  })
}

// 1. Testar Cadastro de Cliente (POST /v1/clientes/)
const testarCadastroCliente = async () => {
  carregando.value = true
  try {
    const payload = {
      nome_usuario: "Matheus Antunes",
      nome_tratamento: "Matheus",
      cpf: "123.456.789-00",
      idade: 23,
      genero: "Masculino",
      forma_pagamento_preferida: "cartao_credito",
      localizacao_inicial: "Palhoça, SC"
    }

    const response = await fetch(`${API_URL}/clientes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const dados = await response.json()
    if (response.ok) {
      clienteId.value = dados.id // Salva o ID gerado pelo Supabase para os próximos testes
      adicionarLog('✅ Cliente Cadastrado com Sucesso!', dados)
    } else {
      adicionarLog('❌ Erro ao Cadastrar Cliente', dados)
    }
  } catch (error) {
    adicionarLog('💥 Erro de Conexão com o Backend', error.message)
  } finally {
    carregando.value = false
  }
}

// 2. Testar Criação de Agendamento (POST /v1/agendamentos/)
const testarCriarAgendamento = async () => {
  if (!clienteId.value) {
    alert('Por favor, cadastre um cliente primeiro para obter um ID válido!')
    return
  }
  
  carregando.value = true
  try {
    const payload = {
      estabelecimento_id: "037fc976-d21c-4699-bf51-577c3dc71ebb", // Simulação de UUID de estabelecimento
      cliente_id: clienteId.value,
      profissional_envolvido: "Teste",
      tratamento: "Testinho",
      tecnica: "Testinho",
      produto: "Testinho",
      data_hora_inicio: new Date(Date.now() + 86400000).toISOString(), // Amanhã neste mesmo horário
      duracao_estimada_minutos: 45
    }

    const response = await fetch(`${API_URL}/agendamentos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const dados = await response.json()
    if (response.ok) {
      agendamentoId.value = dados.id // Salva o ID do agendamento para testar o encerramento
      adicionarLog('✅ Agendamento Solicitado (Status: Pendente)!', dados)
    } else {
      adicionarLog('❌ Erro ao Criar Agendamento', dados)
    }
  } catch (error) {
    adicionarLog('💥 Erro de Conexão com o Backend', error.message)
  } finally {
    carregando.value = false
  }
}

// 3. Testar Encerramento e Avaliação Mútua (POST /v1/agendamentos/{id}/encerrar)
const testarEncerrarTratamento = async () => {
  if (!agendamentoId.value) {
    alert('Por favor, crie um agendamento primeiro para obter um ID válido!')
    return
  }

  carregando.value = true
  try {
    const payload = {
      avaliacao: {
        avaliacao_estabelecimento_nota: 5,
        comentario_cliente: "Excelente atendimento, produtos de ótima qualidade!",
        avaliacao_cliente_nota: 5,
        comentario_estabelecimento: "Cliente pontual e muito educado."
      },
      custo_final: 85.50
    }

    // Passamos o custo_final como query parameter de acordo com a nossa rota FastAPI
    const response = await fetch(`${API_URL}/agendamentos/${agendamentoId.value}/encerrar?custo_final=${payload.custo_final}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.avaliacao)
    })
    
    const dados = await response.json()
    if (response.ok) {
      adicionarLog('✅ Tratamento Encerrado e Avaliado!', dados)
    } else {
      adicionarLog('❌ Erro ao Encerrar Tratamento', dados)
    }
  } catch (error) {
    adicionarLog('💥 Erro de Conexão com o Backend', error.message)
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="container">
    <header>
      <h1>Levvel - Painel de Testes do Front-end (Vite + Vue)</h1>
      <p>Utilize os botões abaixo para disparar requisições assíncronas ao FastAPI e validar o fluxo no Supabase.</p>
    </header>

    <main class="painel-acoes">
      <div class="card">
        <h3>Módulo Cliente</h3>
        <button @click="testarCadastroCliente" :disabled="carregando">
          1. Cadastrar Cliente de Teste
        </button>
        <p v-if="clienteId" class="status-id">ID do Cliente ativo: <code>{{ clienteId }}</code></p>
      </div>

      <div class="card">
        <h3>Módulo Agendamento & Fluxo</h3>
        <button @click="testarCriarAgendamento" :disabled="carregando || !clienteId">
          2. Solicitar Agendamento (Pendente)
        </button>
        <button @click="testarEncerrarTratamento" :disabled="carregando || !agendamentoId" class="btn-success">
          3. Simular Execução e Encerrar com Avaliação
        </button>
        <p v-if="agendamentoId" class="status-id">ID do Agendamento ativo: <code>{{ agendamentoId }}</code></p>
      </div>
    </main>

    <section class="console-logs">
      <h2>Console de Respostas da API</h2>
      <div v-if="logs.length === 0" class="no-logs">Nenhuma requisição disparada até o momento.</div>
      <div v-else class="log-item" v-for="log in logs" :key="log.id">
        <div class="log-header">
          <span class="log-time">[{{ log.horario }}]</span>
          <strong>{{ log.acao }}</strong>
        </div>
        <pre class="log-body"><code>{{ log.dados }}</code></pre>
      </div>
    </section>
  </div>
</template>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  color: #333;
}
header {
  text-align: center;
  margin-bottom: 30px;
}
.painel-acoes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}
.card {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
button {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-success {
  background: #28a745;
}
.status-id {
  font-size: 0.85em;
  color: #555;
  background: #eef2f7;
  padding: 6px;
  border-radius: 4px;
  word-break: break-all;
}
.console-logs {
  background: #1e1e1e;
  color: #a9b7c6;
  border-radius: 8px;
  padding: 20px;
}
.console-logs h2 {
  color: #fff;
  margin-top: 0;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}
.no-logs {
  color: #777;
  font-style: italic;
}
.log-item {
  margin-bottom: 15px;
  border-left: 3px solid #007bff;
  padding-left: 10px;
}
.log-header {
  margin-bottom: 5px;
}
.log-time {
  color: #858585;
  margin-right: 8px;
}
.log-body {
  background: #2b2b2b;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9em;
}
</style>