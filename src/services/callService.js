import { supabase } from '../lib/supabase';

class CallService {
  constructor() {
    this.subscription = null;
    this.onCallChange = null;
  }

  setCallChangeListener(callback) {
    this.onCallChange = callback;
  }

  async startListening(userId) {
    if (this.subscription) {
      await supabase.removeChannel(this.subscription);
    }

    this.subscription = supabase
      .channel('public:calls')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls' },
        (payload) => {
          const call = payload.new;
          if (call && (call.caller_id === userId || call.receiver_id === userId)) {
            if (this.onCallChange) {
              this.onCallChange(call, payload.eventType);
            }
          }
        }
      )
      .subscribe();
  }

  async stopListening() {
    if (this.subscription) {
      await supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  async logDebug(title, data) {
    window.dispatchEvent(new CustomEvent('orvix-debug-log', {
      detail: { source: 'callService', title, data }
    }));
  }

  async createCall(receiverId, chatId, callType) {
    try {
      this.logDebug('CALL_CREATE_STARTED', { receiverId, callType });
      const { data, error } = await supabase.functions.invoke('create-call', {
        body: { receiver_id: receiverId, chat_id: chatId, call_type: callType }
      });
      
      if (error) throw error;
      this.logDebug('CALL_CREATE_SUCCESS', data);
      return data;
    } catch (e) {
      this.logDebug('CALL_CREATE_ERROR', { error: e.message });
      throw e;
    }
  }

  async answerCall(callId) {
    try {
      this.logDebug('CALL_ACCEPT_STARTED', { callId });
      const { data, error } = await supabase.functions.invoke('answer-call', {
        body: { call_id: callId }
      });
      
      if (error) throw error;
      this.logDebug('CALL_ACCEPT_SUCCESS', data);
      return data;
    } catch (e) {
      this.logDebug('CALL_ACCEPT_ERROR', { error: e.message });
      throw e;
    }
  }

  async rejectCall(callId) {
    try {
      this.logDebug('CALL_REJECT_STARTED', { callId });
      const { data, error } = await supabase.functions.invoke('reject-call', {
        body: { call_id: callId }
      });
      
      if (error) throw error;
      this.logDebug('CALL_REJECT_SUCCESS', data);
      return data;
    } catch (e) {
      this.logDebug('CALL_REJECT_ERROR', { error: e.message });
      throw e;
    }
  }

  async endCall(callId) {
    try {
      this.logDebug('CALL_END_STARTED', { callId });
      const { data, error } = await supabase.functions.invoke('end-call', {
        body: { call_id: callId }
      });
      
      if (error) throw error;
      this.logDebug('CALL_END_SUCCESS', data);
      return data;
    } catch (e) {
      this.logDebug('CALL_END_ERROR', { error: e.message });
      throw e;
    }
  }
}

export const callService = new CallService();
