import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter()
	},
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	}
};
