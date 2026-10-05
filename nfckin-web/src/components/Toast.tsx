import { useToast } from '../toast';

export default function Toast() {
  const { messages, dismiss } = useToast();
  return (
    <>
      {messages.map((m) => (
        <div key={m.id} className={`toast ${m.kind}`} onClick={() => dismiss(m.id)}>
          {m.text}
        </div>
      ))}
    </>
  );
}
