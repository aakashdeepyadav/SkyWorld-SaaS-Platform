import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ChatWidget.css';

/* ── Predefined Q&A knowledge base ── */
const KNOWLEDGE_BASE = [
  {
    keywords: ['pricing', 'price', 'cost', 'how much', 'rate', 'charge', 'fee'],
    answer:
      'Our pricing varies by service. We offer website development starting from ₹4,999, combo packages, and monthly maintenance plans. Visit our Services page for detailed pricing, or contact our team for a custom quote!',
  },
  {
    keywords: ['service', 'services', 'what do you', 'offer', 'provide'],
    answer:
      'We offer a range of digital services including Website Development, Branding & Design, App Development, Monthly Maintenance Plans, and Combo Packages. Check out our homepage to explore all services!',
  },
  {
    keywords: ['project', 'track', 'status', 'progress', 'update'],
    answer:
      'You can track your project status from the Projects section in your dashboard. It shows real-time progress, milestones, and any updates from the development team.',
  },
  {
    keywords: ['payment', 'pay', 'invoice', 'billing', 'transaction'],
    answer:
      'You can view and manage your payments from the Payments section. We support secure online payments through Razorpay. If you have a billing query, reach out to support!',
  },
  {
    keywords: ['meeting', 'book', 'schedule', 'call', 'consultation'],
    answer:
      'You can book a free consultation meeting directly from the "Book Meeting" option in your dashboard sidebar. Pick a date and time that works for you!',
  },
  {
    keywords: ['contact', 'reach', 'email', 'support', 'help'],
    answer:
      'You can reach us at support@skyworld.buzz or use the Contact page. For quick help, use the "Chat with Support" option right here!',
  },
  {
    keywords: ['refund', 'cancel', 'money back'],
    answer:
      'For refund or cancellation queries, please contact our support team at support@skyworld.buzz with your order details. We handle each case individually.',
  },
  {
    keywords: ['time', 'delivery', 'how long', 'timeline', 'deadline', 'turnaround'],
    answer:
      'Project timelines depend on the scope. Simple websites take 5-7 days, while complex projects may take 2-4 weeks. You will get a timeline estimate during the consultation.',
  },
  {
    keywords: ['request', 'custom', 'custom request', 'requirement'],
    answer:
      'Have a unique requirement? Submit a Custom Request from your dashboard and our team will review it and get back with a proposal!',
  },
  {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'sup', 'yo'],
    answer: "Hey there! 👋 I'm SkyBot, your SkyWorld assistant. How can I help you today? You can ask me about services, pricing, your projects, or anything else!",
  },
  {
    keywords: ['thanks', 'thank you', 'thx', 'great', 'awesome', 'cool'],
    answer: "You're welcome! 😊 Let me know if there's anything else I can help with.",
  },
  {
    keywords: ['who are you', 'what are you', 'bot', 'skybot'],
    answer:
      "I'm SkyBot — your AI assistant for SkyWorld Ventures! I can answer common questions about our services, pricing, and how to navigate the platform. For complex queries, try the 'Chat with Support' tab!",
  },
];

const DEFAULT_RESPONSE =
  "I'm not sure I understand that. Could you try rephrasing? You can also switch to the **Support** tab to chat with our team directly!";

const QUICK_SUGGESTIONS = [
  'What services do you offer?',
  'How much does it cost?',
  'How do I track my project?',
  'Book a meeting',
];

/* ── Helper: match query to knowledge base ── */
function findAnswer(query) {
  const lower = query.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        score += kw.length; // longer matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestMatch ? bestMatch.answer : DEFAULT_RESPONSE;
}

/* ═══════════════════════════════════════════════════════════════════════════ */

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'support'
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm SkyBot, your SkyWorld assistant. Ask me anything about our services, pricing, or your account!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  const handleSend = useCallback(
    (text) => {
      const msgText = (text || input).trim();
      if (!msgText) return;

      const userMsg = { id: Date.now(), role: 'user', text: msgText };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      // Simulate typing delay
      const delay = 600 + Math.random() * 800;
      setTimeout(() => {
        const answer = findAnswer(msgText);
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: 'bot', text: answer },
        ]);
        setIsTyping(false);
      }, delay);
    },
    [input],
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Floating toggle button ── */}
      <button
        id="chat-widget-toggle"
        className={`chat-widget-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {!isOpen && <span className="chat-notif-dot" />}
        {isOpen ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div className={`chat-widget-panel ${isOpen ? 'visible' : ''}`}>
        {/* Header */}
        <div className="chat-widget-header">
          <div className="header-avatar">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
          </div>
          <div className="header-info">
            <h3>SkyBot</h3>
            <p>
              <span className="online-dot" />
              Always online
            </p>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="chat-widget-tabs">
          <button
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
            Chat
          </button>
          <button
            className={activeTab === 'support' ? 'active' : ''}
            onClick={() => setActiveTab('support')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
            Support
          </button>
        </div>

        {/* ── Chat Tab ── */}
        {activeTab === 'chat' && (
          <>
            <div className="chat-widget-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-msg ${msg.role}`}>
                  <div className="msg-avatar">
                    {msg.role === 'bot' ? '✦' : user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="msg-bubble">{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="chat-typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions (show only when few messages) */}
            {messages.length <= 2 && (
              <div className="chat-quick-actions">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chat-widget-input">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* ── Support Tab ── */}
        {activeTab === 'support' && (
          <div className="chat-support-options">
            <Link to="/contact" className="support-option-card" onClick={() => setIsOpen(false)}>
              <div className="option-icon" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="#0ea5e9" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <div className="option-text">
                <h4>Send a Message</h4>
                <p>Fill out the contact form</p>
              </div>
              <div className="option-arrow">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>

            <a
              href="mailto:support@skyworld.buzz"
              className="support-option-card"
            >
              <div className="option-icon" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="#a855f7" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z"
                  />
                </svg>
              </div>
              <div className="option-text">
                <h4>Email Us</h4>
                <p>support@skyworld.buzz</p>
              </div>
              <div className="option-arrow">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </a>

            <Link to="/book-meeting" className="support-option-card" onClick={() => setIsOpen(false)}>
              <div className="option-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
              </div>
              <div className="option-text">
                <h4>Book a Meeting</h4>
                <p>Schedule a free consultation</p>
              </div>
              <div className="option-arrow">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>

            <a
              href="https://wa.me/918890461846"
              target="_blank"
              rel="noopener noreferrer"
              className="support-option-card"
            >
              <div className="option-icon" style={{ background: 'rgba(37, 211, 102, 0.1)' }}>
                <svg viewBox="0 0 24 24" fill="#25D366" width="20" height="20">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div className="option-text">
                <h4>WhatsApp</h4>
                <p>Chat on WhatsApp</p>
              </div>
              <div className="option-arrow">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </a>

            <Link to="/faq" className="support-option-card" onClick={() => setIsOpen(false)}>
              <div className="option-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div className="option-text">
                <h4>FAQ</h4>
                <p>Browse common questions</p>
              </div>
              <div className="option-arrow">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatWidget;
