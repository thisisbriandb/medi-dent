'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Phone, Video, Send, PlusCircle } from 'lucide-react';

const conversations = [
  { id: 1, name: 'Dr. Alain Dupont', lastMessage: 'Bonjour! Comment allez-vous aujourd\'hui?', avatar: '/avatars/dr-dupont.png', online: true },
  { id: 2, name: 'Dr. Marie Curie', lastMessage: 'Votre rendez-vous est confirmé pour demain.', avatar: '/avatars/dr-curie.png', online: false },
  { id: 3, name: 'Support AlloDocta', lastMessage: 'Merci de nous avoir contactés.', avatar: '/logo.png', online: true },
];

const initialMessages: Record<number, { from: string; text: string }[]> = {
  1: [
    { from: 'other', text: 'Bonjour! Comment allez-vous aujourd\'hui?' },
    { from: 'me', text: 'Je vais bien, merci. J\'ai une question sur mon traitement.' },
  ],
  2: [
    { from: 'other', text: 'Votre rendez-vous est confirmé pour demain.' },
  ],
  3: [],
};

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const currentMessages = messages[selectedConversation.id] || [];
    setMessages({
      ...messages,
      [selectedConversation.id]: [...currentMessages, { from: 'me', text: newMessage }],
    });
    setNewMessage('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[calc(100vh-80px)]">
      {/* Conversations List */}
      <div className="col-span-1 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input placeholder="Rechercher..." className="pl-10 bg-white" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`flex items-center p-4 cursor-pointer hover:bg-slate-100 ${selectedConversation.id === convo.id ? 'bg-indigo-50' : ''}`}
              onClick={() => setSelectedConversation(convo)}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={convo.avatar} alt={convo.name} />
                  <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {convo.online && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>}
              </div>
              <div className="ml-4 flex-1">
                <p className="font-semibold text-slate-800">{convo.name}</p>
                <p className="text-sm text-slate-500 truncate">{convo.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                <PlusCircle className="w-5 h-5 mr-2"/>
                Nouvelle Conversation
            </Button>
        </div>
      </div>

      {/* Chat Window */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                  <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <p className="font-semibold text-slate-900">{selectedConversation.name}</p>
                  <p className="text-sm text-slate-500">
                    {selectedConversation.online ? 'En ligne' : 'Hors ligne'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Phone className="w-5 h-5 text-slate-600" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Video className="w-5 h-5 text-slate-600" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
              <div className="space-y-6">
                {(messages[selectedConversation.id] || []).map((msg, index) => (
                  <div key={index} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${msg.from === 'me' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="relative">
                <Input
                  placeholder="Écrivez votre message..."
                  className="w-full rounded-full py-6 px-6 pr-20 bg-slate-100 border-transparent focus:ring-indigo-500 focus:border-indigo-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSendMessage}
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <p>Sélectionnez une conversation pour commencer à discuter.</p>
          </div>
        )}
      </div>
    </div>
  );
}