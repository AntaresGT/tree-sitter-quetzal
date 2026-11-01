local raiz = vim.fn.getcwd()
vim.opt.runtimepath:prepend(raiz .. '/.referencia/nvim-treesitter')

vim.filetype.add({ extension = { qz = 'quetzal' } })
vim.treesitter.language.add('quetzal', {
  path = raiz .. '/libtree-sitter-quetzal.so',
})

for _, nombre in ipairs({ 'highlights', 'locals', 'folds', 'indents', 'injections' }) do
  local contenido = table.concat(vim.fn.readfile(raiz .. '/queries/' .. nombre .. '.scm'), '\n')
  vim.treesitter.query.set('quetzal', nombre, contenido)
end

local buf = vim.api.nvim_create_buf(false, true)
vim.api.nvim_buf_set_lines(buf, 0, -1, false, {
  'vacio saludar() {',
  'retornar "Hola"',
  '}',
})
vim.bo[buf].filetype = 'quetzal'
vim.api.nvim_win_set_buf(0, buf)

local analizador = vim.treesitter.get_parser(buf, 'quetzal')
local arbol = analizador:parse()[1]
assert(arbol ~= nil, 'Neovim no produjo un árbol sintáctico')
assert(not arbol:root():has_error(), 'El árbol de Neovim contiene errores')

vim.treesitter.start(buf, 'quetzal')
assert(vim.treesitter.highlighter.active[buf] ~= nil, 'El resaltado no se activó')
local capturas = vim.treesitter.get_captures_at_pos(buf, 0, 0)
local tipo_encontrado = false
for _, captura in ipairs(capturas) do
  tipo_encontrado = tipo_encontrado or captura.capture == 'type.builtin'
end
assert(tipo_encontrado, 'No se obtuvo la captura type.builtin')

vim.wo[0].foldmethod = 'expr'
vim.wo[0].foldexpr = 'v:lua.vim.treesitter.foldexpr()'
vim.cmd('normal! zx')
assert(vim.fn.foldlevel(2) > 0, 'El bloque no es plegable')

vim.bo[buf].shiftwidth = 4
vim.bo[buf].expandtab = true
vim.bo[buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
vim.cmd('normal! gg=G')
local linea_retorno = vim.api.nvim_buf_get_lines(buf, 1, 2, false)[1]
assert(linea_retorno == '    retornar "Hola"',
  'La indentación Tree-sitter produjo: ' .. vim.inspect(linea_retorno))

print('Neovim: parser, resaltado, plegado e indentación verificados.')
vim.cmd('qa!')
