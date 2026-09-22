function SettingsScreen({ theme, setTheme, onLogout }) {
  const { Card, ListRow, Avatar, Button, Input, Select, Tabs } = ORK;
  return (
    <div className="kit-page" style={{ maxWidth: 880 }}>
      <PageHead eyebrow="Configurações" title="Sua conta" />
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Avatar name="Felipe Souza" size={56} ring />
          <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontWeight: 600, fontSize: 16 }}>Felipe Souza</div><div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Administrador · Agência Oper</div></div>
          <Button variant="secondary" size="sm" icon="pencil-simple">Editar perfil</Button>
        </div>
        <div className="kit-grid-2">
          <Input label="E-mail" defaultValue="felipe@oper.com.br" />
          <Select label="Região padrão" options={['Todo o Brasil', 'Sul', 'Sudeste', 'Centro-Oeste']} />
        </div>
      </Card>
      <Card title="Aparência">
        <Tabs variant="segmented" value={theme} onChange={setTheme} items={[{ value: 'dark', label: 'Escuro', icon: 'moon' }, { value: 'light', label: 'Claro', icon: 'sun' }]} />
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ListRow icon="users-three" title="Usuários e permissões" subtitle="6 usuários · 2 parceiros" arrow onClick={() => {}} />
        <ListRow icon="key" title="Integrações e API" subtitle="Token ativo · expira em 12/2026" arrow onClick={() => {}} />
        <ListRow icon="bell-simple" title="Notificações" subtitle="E-mail e push" arrow onClick={() => {}} />
        <ListRow icon="shield-check" title="Segurança" subtitle="Autenticação em 2 etapas ativa" arrow onClick={() => {}} />
        <ListRow icon="lifebuoy" title="Ajuda e suporte" subtitle="Seg–sex, 8h às 18h" arrow onClick={() => {}} />
        <Button variant="danger" size="lg" block icon="sign-out" onClick={onLogout} style={{ marginTop: 6 }}>Sair</Button>
      </div>
    </div>
  );
}
window.SettingsScreen = SettingsScreen;
