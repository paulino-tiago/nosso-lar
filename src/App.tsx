import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { ShoppingCart, DollarSign, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

interface ItemMercado {
  id: string;
  name: string;
  purchased: boolean;
}

interface Transacao {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

export default function App() {
  const [tab, setTab] = useState<"mercado" | "financas">("mercado");

  // Estados Mercado
  const [itens, setItens] = useState<ItemMercado[]>([]);
  const [novoItem, setNovoItem] = useState("");

  // Estados Finanças
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipoTransacao, setTipoTransacao] = useState<"income" | "expense">("expense");

  // Carregar dados iniciais
  useEffect(() => {
    carregarMercado();
    carregarTransacoes();
  }, []);

  async function carregarMercado() {
    const { data } = await supabase.from("grocery_items").select("*").order("id", { ascending: false });
    if (data) setItens(data as ItemMercado[]);
  }

  async function carregarTransacoes() {
    const { data } = await supabase.from("transactions").select("*").order("id", { ascending: false });
    if (data) setTransacoes(data as Transacao[]);
  }

  async function adicionarItem(e: React.FormEvent) {
    e.preventDefault();
    if (!novoItem.trim()) return;

    const { data } = await supabase.from("grocery_items").insert([{ name: novoItem.trim(), purchased: false }]).select();
    if (data) {
      setItens([data[0] as ItemMercado, ...itens]);
      setNovoItem("");
    }
  }

  async function alternarComprado(item: ItemMercado) {
    const { error } = await supabase.from("grocery_items").update({ purchased: !item.purchased }).eq("id", item.id);
    if (!error) {
      setItens(itens.map((i) => (i.id === item.id ? { ...i, purchased: !item.purchased } : i)));
    }
  }

  async function removerItem(id: string) {
    const { error } = await supabase.from("grocery_items").delete().eq("id", id);
    if (!error) {
      setItens(itens.filter((i) => i.id !== id));
    }
  }

  async function adicionarTransacao(e: React.FormEvent) {
    e.preventDefault();
    const valorNumerico = parseFloat(valor);
    if (!descricao.trim() || isNaN(valorNumerico)) return;

    const { data } = await supabase.from("transactions").insert([
      { description: descricao.trim(), amount: valorNumerico, type: tipoTransacao }
    ]).select();

    if (data) {
      setTransacoes([data[0] as Transacao, ...transacoes]);
      setDescricao("");
      setValor("");
    }
  }

  async function removerTransacao(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      setTransacoes(transacoes.filter((t) => t.id !== id));
    }
  }

  const saldo = transacoes.reduce((acc, t) => (t.type === "income" ? acc + Number(t.amount) : acc - Number(t.amount)), 0);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-20 shadow-lg">
      <header className="bg-indigo-600 p-4 text-white">
        <h1 className="text-xl font-bold">Nosso Espaço</h1>
        <p className="text-xs text-indigo-100">Gestão partilhada e descomplicada</p>
      </header>

      <main className="p-4">
        {tab === "mercado" ? (
          <div>
            <form onSubmit={adicionarItem} className="mb-4 flex gap-2">
              <input
                type="text"
                value={novoItem}
                onChange={(e) => setNovoItem(e.target.value)}
                placeholder="Adicionar produto..."
                className="flex-1 rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-indigo-500"
              />
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                <Plus size={18} />
              </button>
            </form>

            <div className="space-y-2">
              {itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                  <button onClick={() => alternarComprado(item)} className="flex items-center gap-2 text-left">
                    {item.purchased ? (
                      <CheckCircle2 className="text-green-500" size={18} />
                    ) : (
                      <Circle className="text-gray-400" size={18} />
                    )}
                    <span className={`text-sm ${item.purchased ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {item.name}
                    </span>
                  </button>
                  <button onClick={() => removerItem(item.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {itens.length === 0 && <p className="text-center text-xs text-gray-400">Nenhum produto registado.</p>}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm text-center">
              <span className="text-xs text-gray-500">Saldo Atual</span>
              <p className={`text-2xl font-bold ${saldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                R$ {saldo.toFixed(2)}
              </p>
            </div>

            <form onSubmit={adicionarTransacao} className="mb-4 space-y-2 rounded-xl bg-white p-3 shadow-sm">
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição do gasto ou receita"
                className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Valor (R$)"
                  className="w-1/2 rounded-lg border border-gray-300 p-2 text-sm outline-none"
                />
                <select
                  value={tipoTransacao}
                  onChange={(e) => setTipoTransacao(e.target.value as "income" | "expense")}
                  className="w-1/2 rounded-lg border border-gray-300 p-2 text-sm outline-none bg-white"
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>
              <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Lançar
              </button>
            </form>

            <div className="space-y-2">
              {transacoes.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.description}</p>
                    <span className="text-xs text-gray-400 capitalize">{t.type === "income" ? "Receita" : "Despesa"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.type === "income" ? "+" : "-"} R$ {Number(t.amount).toFixed(2)}
                    </span>
                    <button onClick={() => removerTransacao(t.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {transacoes.length === 0 && <p className="text-center text-xs text-gray-400">Nenhuma transação registada.</p>}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md border-t border-gray-200 bg-white shadow-md">
        <button
          onClick={() => setTab("mercado")}
          className={`flex flex-1 flex-col items-center py-2.5 text-xs font-medium ${
            tab === "mercado" ? "text-indigo-600" : "text-gray-500"
          }`}
        >
          <ShoppingCart size={20} />
          <span>Mercado</span>
        </button>
        <button
          onClick={() => setTab("financas")}
          className={`flex flex-1 flex-col items-center py-2.5 text-xs font-medium ${
            tab === "financas" ? "text-indigo-600" : "text-gray-500"
          }`}
        >
          <DollarSign size={20} />
          <span>Finanças</span>
        </button>
      </nav>
    </div>
  );
}