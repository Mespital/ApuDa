FROM python:3.11-slim-bookworm AS build
ARG VOXCPM_RUNTIME_COMMIT=88bd37eb671f67cf8d747140ed100231756e0bc3
RUN apt-get update && apt-get install -y --no-install-recommends build-essential cmake git libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN git init . && git remote add origin https://github.com/tc-mb/llama.cpp-omni.git \
    && git fetch --depth 1 origin "$VOXCPM_RUNTIME_COMMIT" && git checkout --detach FETCH_HEAD
# Keep CPU work to two threads. Native host-specific flags are disabled for VPS portability.
RUN python - <<'PY'
from pathlib import Path
p = Path('tools/omni/voxcpm2/voxcpm2_cli.cpp')
text = p.read_text()
needle = '    VoxCPM2GenerateParams params;'
assert text.count(needle) == 1
p.write_text(text.replace(needle, '    runtime.set_n_threads(2);\n' + needle))
PY
RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF \
      -DGGML_NATIVE=OFF -DGGML_CUDA=OFF -DGGML_VULKAN=OFF -DGGML_METAL=OFF \
      -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF -DLLAMA_BUILD_APP=OFF -DLLAMA_BUILD_UI=OFF \
    && cmake --build build --target voxcpm2-cli --parallel 2

FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 libssl3 ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/voxcpm
COPY --from=build /src/build/bin/voxcpm2-cli /opt/voxcpm/voxcpm2-cli
COPY --from=build /src/LICENSE /opt/voxcpm/RUNTIME-LICENSE
COPY server.py index.html /opt/voxcpm/
ENV PYTHONUNBUFFERED=1 OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2
USER 10001:10001
EXPOSE 8818
CMD ["python", "server.py"]
