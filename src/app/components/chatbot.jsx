"use client";

import { useState, useEffect, useRef } from "react";
import {
  PaperPlaneTilt,
  UploadSimple,
  Bell,
  Sun,
  Moon,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Image from "next/image";

const parseMarkdown = (text) => {
  const lines = text.split("\n");
  const elements = [];
  let currentList = null;

  lines.forEach((line, index) => {
    line = line.trim();

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="text-2xl font-semibold mt-6 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("**") && line.endsWith(":**")) {
      elements.push(
        <h3 key={index} className="text-xl font-bold mt-5 mb-3">
          {line.replace(/\*\*/g, "").replace(":", "")}
        </h3>
      );
    } else if (line.includes("**")) {
      const parts = line.split(/(\*\*.*?\*\*)/);
      const formatted = parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-bold">
              {part.replace(/\*\*/g, "")}
            </strong>
          );
        }
        return part;
      });
      elements.push(
        <p key={index} className="text-lg font-medium mt-4 mb-4">
          {formatted}
        </p>
      );
    } else if (line.startsWith("* ")) {
      if (!currentList) {
        currentList = [];
        elements.push(
          <ul
            key={`ul-${index}`}
            className="list-disc list-inside ml-4 mt-4 mb-4"
          >
            {currentList}
          </ul>
        );
      }
      currentList.push(
        <li key={index} className="text-lg font-medium mt-2">
          {line.replace("* ", "")}
        </li>
      );
    } else if (line) {
      currentList = null;
      elements.push(
        <p key={index} className="text-lg font-medium mt-4 mb-4">
          {line}
        </p>
      );
    } else if (!line && elements.length > 0) {
      elements.push(<div key={index} className="h-4" />);
    }
  });

  return elements;
};

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedFile, setSelectedFile] = useState(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true); // Novo estado
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Por favor, selecione um arquivo PDF.");
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const fileMessage = {
      text: `Arquivo PDF enviado: ${selectedFile.name}`,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, fileMessage]);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sessionId", sessionId);
      formData.append("action", "uploadFile");

      const response = await fetch(
        "https://n8n-n8n-start.qzl94u.easypanel.host/webhook/upload-document",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro HTTP: ${response.status} ${response.statusText}. Resposta: ${errorText}`
        );
      }

      const botMessage = {
        text: "Arquivo recebido com sucesso!",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error.message);
      const errorMessage = {
        text: `Erro ao enviar o arquivo: ${error.message}. Tente novamente.`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setSelectedFile(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsBotTyping(true);

    try {
      const response = await fetch(
        "https://n8n-n8n-start.qzl94u.easypanel.host/webhook/cec6e249-cb31-4875-9f1c-9f2f0d8363d0/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: sessionId,
            action: "sendMessage",
            chatInput: input,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const botMessage = {
        text: data.output || "Desculpe, não consegui processar sua mensagem.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage = {
        text: "Erro ao conectar com o servidor. Tente novamente.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
    if (hasUnreadNotifications) {
      setHasUnreadNotifications(false); // Marca como lido ao abrir
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Cabeçalho */}
      <header
        className={`p-6 flex justify-between items-center shadow-sm ${
          isDarkMode
            ? "bg-gradient-to-r from-gray-900 to-gray-800"
            : "bg-gradient-to-r from-gray-100 to-gray-200"
        }`}
      >
        <div className="flex items-center gap-4">
          <Image
            src="/geraldo.png"
            alt="Geraldo AI"
            width={60}
            height={60}
            className="rounded-full border-2 border-blue-600/20 object-cover hover:scale-105 transition-transform duration-300"
          />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Geraldo AI
            </h1>
            <p
              className={`text-lg font-medium leading-relaxed ${
                isDarkMode ? "opacity-70" : "opacity-80"
              }`}
            >
              Estou aqui para te ajudar com seus documentos, tirar qualquer
              dúvida referente ao conteúdo, posso fazer resumos, gerar questões,
              criar FlashCards e muito mais! Fique à vontade!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200/20 transition-colors focus:outline-none"
          >
            {isDarkMode ? (
              <Sun size={24} className="text-gray-400" />
            ) : (
              <Moon size={24} className="text-blue-600" />
            )}
          </button>
          <button
            onClick={toggleNotification}
            className="p-2 rounded-full hover:bg-gray-200/20 transition-colors focus:outline-none relative"
          >
            <Bell
              size={24}
              className={`${isDarkMode ? "text-gray-400" : "text-blue-600"}`}
            />
            {hasUnreadNotifications && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          {isNotificationOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-12 right-0 w-80 p-4 rounded-lg shadow-lg border z-10 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            >
              <h3 className="text-lg font-semibold mb-4">Notificações</h3>
              <div className="space-y-6">
                {/* Tópico 1 */}
                <div className="flex items-start gap-3">
                  <span className="text-blue-500">
                    <UploadSimple size={20} />
                  </span>
                  <div>
                    <h4 className="text-base font-medium mb-1">
                      Dica de Desempenho
                    </h4>
                    <p className="text-sm">
                      Se possível, retire o índice dos documentos para melhorar
                      o desempenho do agente e tornar o processamento mais
                      rápido e eficiente.
                    </p>
                  </div>
                </div>

                {/* Tópico 2 */}
                <div className="flex items-start gap-3">
                  <span className="text-green-500">
                    <WhatsappLogo size={20} />
                  </span>
                  <div>
                    <h4 className="text-base font-medium mb-1">Feedback</h4>
                    <p className="text-sm">
                      Estamos dispostos a ouvir suas sugestões e críticas para
                      melhorar cada vez mais!{" "}
                      <a
                        href="https://wa.me/5561982753197?text=."
                        className="text-blue-500 hover:underline"
                      >
                        Entre em contato com a gente.
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Seção de Upload */}
      <div className="p-4 flex justify-center items-center gap-3">
        <label
          className={`px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
            isDarkMode
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          } shadow-sm`}
        >
          <UploadSimple size={20} />
          Selecionar arquivo PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <button
          onClick={handleFileUpload}
          disabled={!selectedFile}
          className={`px-4 py-2 rounded-lg transition-colors shadow-sm ${
            selectedFile
              ? isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
              : isDarkMode
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-600 cursor-not-allowed"
          }`}
        >
          Enviar
        </button>
      </div>
      <p
        className={`text-center text-lg font-medium mb-4 ${
          isDarkMode ? "opacity-70" : "opacity-80"
        }`}
      >
        Selecione seu documento e clique no botão "Enviar"
      </p>

      {/* Caixa de Mensagens */}
      <div
        className={`flex-1 p-6 overflow-y-auto space-y-4 ${
          isDarkMode ? "bg-gray-800/30" : "bg-gray-200"
        }`}
      >
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-md rounded-bl-xl"
                  : isDarkMode
                  ? "bg-gray-800 border border-gray-700 text-white rounded-tl-md rounded-br-xl"
                  : "bg-blue-200 border border-blue-300 text-gray-900 rounded-tl-md rounded-br-xl"
              }`}
            >
              {msg.sender === "bot" ? (
                <div>{parseMarkdown(msg.text)}</div>
              ) : (
                <p className="text-lg font-medium mt-4 mb-4">{msg.text}</p>
              )}
              <span
                className={`text-base font-light block mt-2 ${
                  isDarkMode ? "opacity-50" : "opacity-60"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        ))}
        {isBotTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div
              className={`p-3 rounded-lg flex items-center gap-1 ${
                isDarkMode ? "bg-gray-800" : "bg-blue-200"
              }`}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    isDarkMode ? "bg-gray-400" : "bg-blue-600"
                  }`}
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <form onSubmit={sendMessage} className="p-6 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tire suas dúvidas aqui..."
            className={`w-full rounded-lg px-5 py-3 shadow-inner border focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-400 text-lg font-medium ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-200 text-gray-900"
            } pr-16`}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <PaperPlaneTilt size={20} />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
