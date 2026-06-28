import { LogOut } from "./Icons";
import { useParticipantContext } from "../../context/ParticipantContext";

export default function Header() {
  const { participant, leaveTournament } = useParticipantContext();

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Prode Mundialista</p>
        <h1>2026</h1>
      </div>
      <div className="header-user">
        <span>{participant?.name}</span>
      </div>
    </header>
  );
}
