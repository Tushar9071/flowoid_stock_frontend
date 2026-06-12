import React from "react";
import { CheckCircle2, MessageCircle, FileText, Building2 } from "lucide-react";

export function WhatsappSection() {
  return (
    <section className="py-24 bg-[#F0FDF4] border-y border-[#DCFCE7] overflow-hidden" id="whatsapp">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#15803D] text-xs font-bold uppercase tracking-wider mb-6">
              <MessageCircle className="w-4 h-4 fill-current" />
              WhatsApp Billing
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#0F1C2E] to-[#4B5C72] font-jakarta mb-6 leading-tight drop-shadow-sm">
              Invoices delivered the moment they're ready.
            </h2>
            
            <p className="text-lg text-[#4B5C72] mb-10 leading-relaxed">
              The instant an order is dispatched, your dealer receives a complete invoice on WhatsApp — no manual messages, no follow-up calls required.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-[#22C55E] shrink-0 mt-0.5" />
                <p className="text-[#4B5C72] leading-relaxed">
                  <strong className="text-[#0F1C2E]">Zero manual effort.</strong> Invoice approved → WhatsApp message sent automatically to your dealer's registered number, in seconds.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-[#22C55E] shrink-0 mt-0.5" />
                <p className="text-[#4B5C72] leading-relaxed">
                  <strong className="text-[#0F1C2E]">Everything in one message.</strong> Order summary, total due, payment deadline, and a secure direct link to download the PDF invoice.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-[#22C55E] shrink-0 mt-0.5" />
                <p className="text-[#4B5C72] leading-relaxed">
                  <strong className="text-[#0F1C2E]">Built for your business.</strong> This integration is configured specifically for your operation — every message carries your business name and identity.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Content - WhatsApp Mockup */}
          <div className="relative mx-auto w-full max-w-[400px] lg:max-w-none lg:pl-10">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#22C55E]/20 to-transparent rounded-full blur-3xl transform -translate-y-10 scale-110"></div>
            
            <div className="relative bg-[#E5DDD5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 flex flex-col h-[520px] max-w-[360px] mx-auto ring-1 ring-black/5">
              
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 shrink-0 shadow-md z-10 relative">
                <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white border border-white/20 shrink-0 shadow-inner">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-[15px] leading-tight truncate">StockFlow Billing</div>
                  <div className="text-white/80 text-[11px] mt-0.5">Online</div>
                </div>
              </div>
              
              {/* WhatsApp Chat Area */}
              <div className="flex-1 p-4 bg-[#EFEAE2] overflow-y-auto flex flex-col justify-end pb-8" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'cover' }}>
                
                {/* Date bubble */}
                <div className="flex justify-center mb-6">
                  <div className="bg-[#E1F3FB] text-[#4B5C72] text-[11px] px-3 py-1.5 rounded-lg shadow-sm font-medium">
                    TODAY
                  </div>
                </div>

                {/* Message Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[92%] mb-2 relative self-start">
                  <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>
                  
                  <div className="text-[#111B21] text-[14px] leading-relaxed mb-2 whitespace-pre-wrap">
                    Namaste <strong className="font-bold">Sharma Ji</strong> 🙏
                    <br/><br/>
                    Your invoice <strong className="font-bold">INV-2026-00318</strong> from <strong className="font-bold">Kundan Jewellers</strong> is ready.
                    <br/><br/>
                    <strong className="font-bold text-[#0F1C2E]">Amount Due: ₹42,500</strong><br/>
                    Due Date: 27 June 2026
                  </div>
                  
                  {/* PDF Attachment Mock */}
                  <div className="bg-[#F0F2F5] rounded-xl p-3 flex items-center gap-3 mt-3 mb-1 border border-[#E2E8F0]">
                    <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#EF4444]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#111B21] font-medium text-[13px] truncate">Invoice INV-2026-00318.pdf</div>
                      <div className="text-[#667781] text-[11px] mt-0.5">148 KB · PDF Document</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end items-center gap-1 mt-1">
                    <span className="text-[#667781] text-[10px]">9:42 AM</span>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
