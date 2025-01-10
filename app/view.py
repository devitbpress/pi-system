from flask import Blueprint, url_for, render_template

bp_view = Blueprint('view', __name__)

# halaman testing
@bp_view.route("/testing")
def testing_view():
    return render_template('testing.html')

# halaman kalkulator
@bp_view.route("/kalkulator")
def manual_calc_view():
    return render_template('kalkulator.html')

# halaman analisis
@bp_view.route("/analisis")
def analysis_view():
    return render_template('analisis.html')

# halaman produk
@bp_view.route("/produk")
def product_view():
    return render_template('produk.html')

@bp_view.route("/")
def index():
    return "<script>window.location.href = '/masuk';</script>"

# halaman masuk
@bp_view.route("/masuk")
def login_view():
    return render_template('masuk.html')

# halaman keluar
@bp_view.route("/keluar")
def keluar_view():
    return render_template('keluar.html')