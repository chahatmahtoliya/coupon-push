const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const file = 'C:/Users/chaha/.codex/hooks.json';
const original = fs.readFileSync(file, 'utf8');
const config = JSON.parse(original);
const command = 'node C:/Users/chaha/.agents/skills/impeccable/scripts/hook.mjs';
const powershell = 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
const previous = config.hooks.Stop[0].hooks[0];
const oldResult = spawnSync(powershell, ['-NoProfile', '-NonInteractive', '-Command', previous.commandWindows], {input:'{}', encoding:'utf8', timeout:10000, windowsHide:true});
console.log('Previous Windows command:', {exitCode:oldResult.status, stderr:oldResult.stderr?.slice(0,950)});
for (const [event, payload] of Object.entries({PostToolUse:{hook_event_name:'PostToolUse',session_id:'hook-repair-check',cwd:'D:/Cpush',tool_name:'Bash',tool_input:{}},Stop:{hook_event_name:'Stop',session_id:'hook-repair-check',cwd:'D:/Cpush',stop_hook_active:true}})) {
 for (const [shell,args] of [[powershell,['-NoProfile','-NonInteractive','-Command',command]],[process.env.ComSpec || 'cmd.exe',['/d','/s','/c',command]]]) {
  const result = spawnSync(shell,args,{input:JSON.stringify(payload),encoding:'utf8',timeout:10000,windowsHide:true});
  console.log('Repaired command:',event,shell,{exitCode:result.status,stderr:result.stderr,stdout:result.stdout?.slice(0,300)});
  if(result.error || result.status !== 0) throw result.error || new Error('Hook verification failed');
 }
}
const backup = `${file}.backup-${Date.now()}`;
fs.copyFileSync(file,backup);
let changed = 0;
for (const groups of Object.values(config.hooks)) for (const group of groups) for (const hook of group.hooks || []) {
 if (hook.type === 'command' && hook.command?.includes('impeccable')) {
  hook.command = command;
  hook.commandWindows = command;
  changed++;
 }
}
fs.writeFileSync(file,JSON.stringify(config,null,2)+'\n');
console.log(`Updated ${changed} hook commands. Backup: ${backup}`);
