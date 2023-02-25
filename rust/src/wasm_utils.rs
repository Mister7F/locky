#![allow(dead_code)]

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
extern "C" {
    pub fn setTimeout(closure: &Closure<dyn FnMut()>, millis: u32) -> f64;
    pub fn cancelTimeout(token: f64);

    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
}

#[wasm_bindgen]
pub struct Timeout {
    closure: Closure<dyn FnMut()>,
    token: f64,
}

impl Timeout {
    pub fn new<F: 'static>(millis: u32, f: F) -> Timeout
    where
        F: FnMut(),
    {
        let closure = Closure::new(f);
        let token = setTimeout(&closure, millis);
        Timeout { closure, token }
    }
}

// When the Timeout is destroyed, cancel its `setTimeout` timer.
impl Drop for Timeout {
    fn drop(&mut self) {
        // cancelTimeout(self.token);
    }
}
