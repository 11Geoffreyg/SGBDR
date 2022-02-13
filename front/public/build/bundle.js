
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const apiData = writable([]);

    const movies = derived(apiData, ($apiData) => {
        if ($apiData.movies) {
            return $apiData.movies
        }

        return []
    });

    const maxPage = derived(apiData, ($apiData) => {
        if ($apiData.pages && !isNaN($apiData.pages)) {
            return $apiData.pages
        }

        return 1
    });

    /* src\App.svelte generated by Svelte v3.46.4 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (48:2) {#each $movies as movie}
    function create_each_block(ctx) {
    	let li;
    	let t0_value = /*movie*/ ctx[12].title + "";
    	let t0;
    	let t1;
    	let t2_value = /*movie*/ ctx[12].category + "";
    	let t2;
    	let t3;
    	let t4_value = /*movie*/ ctx[12].rental_rate + "";
    	let t4;
    	let t5;
    	let t6_value = /*movie*/ ctx[12].rental_number + "";
    	let t6;
    	let t7;
    	let t8_value = /*movie*/ ctx[12].rating + "";
    	let t8;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			t3 = text(" - ");
    			t4 = text(t4_value);
    			t5 = text("€ - ");
    			t6 = text(t6_value);
    			t7 = text(" rentals - ");
    			t8 = text(t8_value);
    			add_location(li, file, 48, 3, 1246);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);
    			append_dev(li, t6);
    			append_dev(li, t7);
    			append_dev(li, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$movies*/ 32 && t0_value !== (t0_value = /*movie*/ ctx[12].title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$movies*/ 32 && t2_value !== (t2_value = /*movie*/ ctx[12].category + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$movies*/ 32 && t4_value !== (t4_value = /*movie*/ ctx[12].rental_rate + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$movies*/ 32 && t6_value !== (t6_value = /*movie*/ ctx[12].rental_number + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*$movies*/ 32 && t8_value !== (t8_value = /*movie*/ ctx[12].rating + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(48:2) {#each $movies as movie}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div3;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t10;
    	let div2;
    	let label2;
    	let t12;
    	let select1;
    	let option3;
    	let option4;
    	let t15;
    	let h2;
    	let t17;
    	let ul;
    	let t18;
    	let button0;
    	let t19;
    	let button0_disabled_value;
    	let t20;
    	let input1;
    	let t21;
    	let button1;
    	let t22;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;
    	let each_value = /*$movies*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Sakila";
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Results:";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Filter by:";
    			t6 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Title";
    			option1 = element("option");
    			option1.textContent = "Category";
    			option2 = element("option");
    			option2.textContent = "Number of rentals";
    			t10 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Order by:";
    			t12 = space();
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "Desc";
    			option4 = element("option");
    			option4.textContent = "Asc";
    			t15 = space();
    			h2 = element("h2");
    			h2.textContent = "Movies";
    			t17 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			button0 = element("button");
    			t19 = text("Previous page");
    			t20 = space();
    			input1 = element("input");
    			t21 = space();
    			button1 = element("button");
    			t22 = text("Next page");
    			add_location(h1, file, 23, 1, 476);
    			attr_dev(label0, "for", "limit");
    			add_location(label0, file, 26, 3, 542);
    			attr_dev(input0, "id", "limit");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", 1);
    			attr_dev(input0, "max", 100);
    			add_location(input0, file, 27, 3, 583);
    			attr_dev(div0, "class", "input svelte-7yv8ek");
    			add_location(div0, file, 25, 2, 518);
    			attr_dev(label1, "for", "filter");
    			add_location(label1, file, 30, 3, 690);
    			option0.__value = "film.title";
    			option0.value = option0.__value;
    			add_location(option0, file, 32, 4, 786);
    			option1.__value = "category.name";
    			option1.value = option1.__value;
    			add_location(option1, file, 33, 4, 833);
    			option2.__value = "rental_number";
    			option2.value = option2.__value;
    			add_location(option2, file, 34, 4, 886);
    			attr_dev(select0, "name", "filter");
    			if (/*orderByType*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[7].call(select0));
    			add_location(select0, file, 31, 3, 733);
    			attr_dev(div1, "class", "input svelte-7yv8ek");
    			add_location(div1, file, 29, 2, 666);
    			attr_dev(label2, "for", "order");
    			add_location(label2, file, 38, 3, 994);
    			option3.__value = "desc";
    			option3.value = option3.__value;
    			add_location(option3, file, 40, 4, 1083);
    			option4.__value = "asc";
    			option4.value = option4.__value;
    			add_location(option4, file, 41, 4, 1123);
    			attr_dev(select1, "name", "order");
    			if (/*orderBy*/ ctx[1] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[8].call(select1));
    			add_location(select1, file, 39, 3, 1035);
    			attr_dev(div2, "class", "input svelte-7yv8ek");
    			add_location(div2, file, 37, 2, 970);
    			attr_dev(div3, "class", "inputs svelte-7yv8ek");
    			add_location(div3, file, 24, 1, 494);
    			add_location(h2, file, 45, 1, 1191);
    			add_location(ul, file, 46, 1, 1209);
    			button0.disabled = button0_disabled_value = /*page*/ ctx[3] <= 1;
    			add_location(button0, file, 51, 1, 1381);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", /*$maxPage*/ ctx[4]);
    			add_location(input1, file, 52, 1, 1459);
    			button1.disabled = button1_disabled_value = /*page*/ ctx[3] >= /*$maxPage*/ ctx[4];
    			add_location(button1, file, 53, 1, 1524);
    			add_location(main, file, 22, 0, 467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div3);
    			append_dev(div3, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*limit*/ ctx[2]);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*orderByType*/ ctx[0]);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t12);
    			append_dev(div2, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			select_option(select1, /*orderBy*/ ctx[1]);
    			append_dev(main, t15);
    			append_dev(main, h2);
    			append_dev(main, t17);
    			append_dev(main, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(main, t18);
    			append_dev(main, button0);
    			append_dev(button0, t19);
    			append_dev(main, t20);
    			append_dev(main, input1);
    			set_input_value(input1, /*page*/ ctx[3]);
    			append_dev(main, t21);
    			append_dev(main, button1);
    			append_dev(button1, t22);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[7]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[8]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*limit*/ 4 && to_number(input0.value) !== /*limit*/ ctx[2]) {
    				set_input_value(input0, /*limit*/ ctx[2]);
    			}

    			if (dirty & /*orderByType*/ 1) {
    				select_option(select0, /*orderByType*/ ctx[0]);
    			}

    			if (dirty & /*orderBy*/ 2) {
    				select_option(select1, /*orderBy*/ ctx[1]);
    			}

    			if (dirty & /*$movies*/ 32) {
    				each_value = /*$movies*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*page*/ 8 && button0_disabled_value !== (button0_disabled_value = /*page*/ ctx[3] <= 1)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*$maxPage*/ 16) {
    				attr_dev(input1, "max", /*$maxPage*/ ctx[4]);
    			}

    			if (dirty & /*page*/ 8 && to_number(input1.value) !== /*page*/ ctx[3]) {
    				set_input_value(input1, /*page*/ ctx[3]);
    			}

    			if (dirty & /*page, $maxPage*/ 24 && button1_disabled_value !== (button1_disabled_value = /*page*/ ctx[3] >= /*$maxPage*/ ctx[4])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $maxPage;
    	let $movies;
    	validate_store(maxPage, 'maxPage');
    	component_subscribe($$self, maxPage, $$value => $$invalidate(4, $maxPage = $$value));
    	validate_store(movies, 'movies');
    	component_subscribe($$self, movies, $$value => $$invalidate(5, $movies = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let orderByType = 'film.title';
    	let orderBy = 'asc';
    	let limit = 10;
    	let page = 1;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		limit = to_number(this.value);
    		$$invalidate(2, limit);
    	}

    	function select0_change_handler() {
    		orderByType = select_value(this);
    		$$invalidate(0, orderByType);
    	}

    	function select1_change_handler() {
    		orderBy = select_value(this);
    		$$invalidate(1, orderBy);
    	}

    	const click_handler = () => $$invalidate(3, page--, page);

    	function input1_input_handler() {
    		page = to_number(this.value);
    		($$invalidate(3, page), $$invalidate(4, $maxPage));
    	}

    	const click_handler_1 = () => $$invalidate(3, page++, page);

    	$$self.$capture_state = () => ({
    		apiData,
    		movies,
    		maxPage,
    		orderByType,
    		orderBy,
    		limit,
    		page,
    		$maxPage,
    		$movies
    	});

    	$$self.$inject_state = $$props => {
    		if ('orderByType' in $$props) $$invalidate(0, orderByType = $$props.orderByType);
    		if ('orderBy' in $$props) $$invalidate(1, orderBy = $$props.orderBy);
    		if ('limit' in $$props) $$invalidate(2, limit = $$props.limit);
    		if ('page' in $$props) $$invalidate(3, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*page, $maxPage*/ 24) {
    			{
    				if (page > $maxPage) $$invalidate(3, page = $maxPage);
    			}
    		}

    		if ($$self.$$.dirty & /*page, limit, orderByType, orderBy*/ 15) {
    			{
    				if (page && limit) {
    					fetch(`https://sgbdr-api.herokuapp.com/movies?orderByType=${orderByType}&orderBy=${orderBy}&limit=${limit}&page=${page}`).then(response => response.json()).then(data => apiData.set(data));
    				}
    			}
    		}
    	};

    	return [
    		orderByType,
    		orderBy,
    		limit,
    		page,
    		$maxPage,
    		$movies,
    		input0_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		click_handler,
    		input1_input_handler,
    		click_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
